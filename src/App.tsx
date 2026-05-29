import {
  Activity,
  Apple,
  Bot,
  Calculator,
  Dumbbell,
  Home,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aiApi, calculatorApi, exercisesApi, foodApi, profileApi, workoutsApi } from './api/mainApi'
import { useAuth } from './auth/AuthContext'
import type {
  CalorieGoal,
  Exercise,
  FitnessProfile,
  FoodItem,
  MealLog,
  OneRmResponse,
  WorkoutExercise,
  WorkoutSession,
  WorkoutTemplate,
  WorkingWeightResponse,
} from './types'

const navItems = [
  { to: '/', label: 'Дашборд', icon: Home },
  { to: '/profile', label: 'Профиль', icon: UserRound },
  { to: '/exercises', label: 'Упражнения', icon: Dumbbell },
  { to: '/workouts', label: 'Тренировки', icon: Activity },
  { to: '/nutrition', label: 'Питание', icon: Apple },
  { to: '/ai', label: 'AI', icon: Bot },
  { to: '/calculator', label: 'Калькулятор', icon: Calculator },
]

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={<ProtectedShell />} />
    </Routes>
  )
}

function ProtectedShell() {
  const { session, isReady, logout } = useAuth()
  const [theme, setTheme] = useState(() => localStorage.getItem('fitmind.theme') ?? 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('fitmind.theme', theme)
  }, [theme])

  if (!isReady) return <div className="loading">Загружаем FitMind AI...</div>
  if (!session) return <Navigate to="/auth" replace />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FM</div>
          <div>
            <strong>FitMind AI</strong>
            <span>умный фитнес кабинет</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button className="icon-button" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Переключить тему">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AuthPage() {
  const { session, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('demo@fitmind.ai')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [navigate, session])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      navigate('/', { replace: true })
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Не удалось войти')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">FM</div>
          <div>
            <strong>FitMind AI</strong>
            <span>тренировки, питание и AI в одном кабинете</span>
          </div>
        </div>
        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Вход
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Регистрация
          </button>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={4} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Подключаем...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Dashboard() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [logs, setLogs] = useState<MealLog[]>([])
  const [goal, setGoal] = useState<CalorieGoal | null>(null)

  useEffect(() => {
    void Promise.all([
      profileApi.get(userId).then(setProfile).catch(() => setProfile(null)),
      workoutsApi.templates(userId).then(setTemplates),
      workoutsApi.sessions(userId).then(setSessions),
      foodApi.list(userId).then(setFoods),
      foodApi.logs(userId).then(setLogs),
      foodApi.goal(userId).then(setGoal).catch(() => setGoal(null)),
    ])
  }, [userId])

  const calories = useMemo(() => nutritionTotals(foods, logs), [foods, logs])
  const workoutChart = [
    { day: 'Пн', minutes: 35 },
    { day: 'Вт', minutes: 0 },
    { day: 'Ср', minutes: 48 },
    { day: 'Чт', minutes: sessions.at(-1)?.duration_minutes ?? 54 },
    { day: 'Пт', minutes: 0 },
    { day: 'Сб', minutes: 62 },
    { day: 'Вс', minutes: 30 },
  ]

  return (
    <section className="page">
      <PageHeader title="Дашборд" subtitle="Сегодняшняя картина по тренировкам, питанию и прогрессу." />
      <div className="metric-grid">
        <Metric title="Калории" value={`${Math.round(calories.calories)} / ${goal?.daily_goal ?? profile?.daily_calories_goal ?? 0}`} caption="ккал за сегодня" />
        <Metric title="Тренировки" value={String(templates.length)} caption="шаблонов в работе" />
        <Metric title="Сессии" value={String(sessions.length)} caption="записей истории" />
        <Metric title="Профиль" value={profile ? `${profile.weight} кг` : 'не заполнен'} caption="текущие данные" />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <h2>Активность недели</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={workoutChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="minutes" stroke="#2563eb" fill="#8fd19e" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Ближайшая тренировка</h2>
          <List>
            {templates.slice(0, 3).map((template) => (
              <li key={template.id}>
                <strong>{template.name}</strong>
                <span>Шаблон #{template.id}</span>
              </li>
            ))}
          </List>
        </section>
      </div>
    </section>
  )
}

function ProfilePage() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''
  const [profile, setProfile] = useState<FitnessProfile>({
    user_id: userId,
    weight: 78,
    height: 180,
    age: 28,
    sex: 'male',
    activity_level: 3,
    daily_calories_goal: 2450,
  })
  const [status, setStatus] = useState('')

  useEffect(() => {
    profileApi.get(userId).then((data) => data && setProfile(data)).catch(() => undefined)
  }, [userId])

  async function save(event: FormEvent) {
    event.preventDefault()
    await profileApi.save({ ...profile, user_id: userId })
    setStatus('Профиль сохранен')
  }

  return (
    <section className="page">
      <PageHeader title="Профиль" subtitle="Данные для рекомендаций, калорий и тренировочных нагрузок." />
      <form className="panel form-grid" onSubmit={save}>
        <NumberField label="Вес, кг" value={profile.weight} onChange={(weight) => setProfile({ ...profile, weight })} />
        <NumberField label="Рост, см" value={profile.height} onChange={(height) => setProfile({ ...profile, height })} />
        <NumberField label="Возраст" value={profile.age} onChange={(age) => setProfile({ ...profile, age })} />
        <label>
          Пол
          <select value={profile.sex} onChange={(event) => setProfile({ ...profile, sex: event.target.value })}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </label>
        <NumberField label="Активность 1-5" value={profile.activity_level} onChange={(activity_level) => setProfile({ ...profile, activity_level })} />
        <NumberField label="Цель калорий" value={profile.daily_calories_goal} onChange={(daily_calories_goal) => setProfile({ ...profile, daily_calories_goal })} />
        <button className="primary-button" type="submit">Сохранить</button>
        <p className="success">{status}</p>
      </form>
    </section>
  )
}

function ExercisesPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<Exercise[]>([])
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('Грудь')

  const load = useCallback(async () => {
    setItems(query ? await exercisesApi.search(query) : await exercisesApi.list())
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  async function add(event: FormEvent) {
    event.preventDefault()
    await exercisesApi.create({ name, muscle_group: muscle, is_custom: true, created_by_user_id: session?.userId })
    setName('')
    await load()
  }

  return (
    <section className="page">
      <PageHeader title="Упражнения" subtitle="База упражнений с поиском и пользовательскими движениями." />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию" />
        </div>
        <button className="secondary-button" type="button" onClick={load}>Найти</button>
      </div>
      <form className="panel inline-form" onSubmit={add}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Новое упражнение" required />
        <input value={muscle} onChange={(event) => setMuscle(event.target.value)} placeholder="Группа мышц" required />
        <button className="primary-button" type="submit"><Plus size={18} />Добавить</button>
      </form>
      <CardGrid>
        {items.map((exercise) => (
          <article className="item-card" key={exercise.id}>
            <strong>{exercise.name}</strong>
            <span>{exercise.muscle_group}</span>
            <small>{exercise.is_custom ? 'Пользовательское' : 'Базовое'}</small>
          </article>
        ))}
      </CardGrid>
    </section>
  )
}

function WorkoutsPage() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [templateExercises, setTemplateExercises] = useState<WorkoutExercise[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [templateName, setTemplateName] = useState('Новая тренировка')
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(1)
  const [sets, setSets] = useState(4)
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(50)
  const [duration, setDuration] = useState(45)

  const load = useCallback(async () => {
    const [nextTemplates, nextExercises, nextSessions] = await Promise.all([
      workoutsApi.templates(userId),
      exercisesApi.list(),
      workoutsApi.sessions(userId),
    ])
    setTemplates(nextTemplates)
    setExercises(nextExercises)
    setSessions(nextSessions)
    const templateId = selectedTemplate || nextTemplates[0]?.id || 0
    setSelectedTemplate(templateId)
    if (templateId) {
      const details = await workoutsApi.templateDetails(templateId)
      setTemplateExercises(details.exercises)
    }
  }, [selectedTemplate, userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selectedTemplate) {
      workoutsApi.templateDetails(selectedTemplate).then((details) => setTemplateExercises(details.exercises)).catch(() => setTemplateExercises([]))
    }
  }, [selectedTemplate])

  async function createTemplate(event: FormEvent) {
    event.preventDefault()
    const created = await workoutsApi.createTemplate(userId, templateName)
    setTemplateName('')
    setSelectedTemplate(created.id)
    await load()
  }

  async function addExercise(event: FormEvent) {
    event.preventDefault()
    await workoutsApi.addExercise({
      template_id: selectedTemplate,
      exercise_id: selectedExercise,
      sets,
      reps,
      weight,
      order_index: templateExercises.length + 1,
    })
    await load()
  }

  async function startAndComplete(templateId: number) {
    const session = await workoutsApi.startSession(userId, templateId)
    await workoutsApi.completeSession(session.id, duration)
    await load()
  }

  return (
    <section className="page">
      <PageHeader title="Тренировки" subtitle="Шаблоны, упражнения внутри шаблона и история сессий." />
      <div className="split-grid">
        <section className="panel">
          <h2>Шаблоны</h2>
          <form className="inline-form" onSubmit={createTemplate}>
            <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
            <button className="primary-button" type="submit"><Plus size={18} />Создать</button>
          </form>
          <List>
            {templates.map((template) => (
              <li key={template.id} className={selectedTemplate === template.id ? 'selected-row' : ''}>
                <button type="button" onClick={() => setSelectedTemplate(template.id)}>{template.name}</button>
                <button type="button" className="secondary-button" onClick={() => void startAndComplete(template.id)}>Завершить {duration} мин</button>
              </li>
            ))}
          </List>
          <label className="range-label">
            Длительность сессии: {duration} мин
            <input type="range" min="15" max="120" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
        </section>
        <section className="panel">
          <h2>Состав тренировки</h2>
          <form className="form-grid compact" onSubmit={addExercise}>
            <label>
              Упражнение
              <select value={selectedExercise} onChange={(event) => setSelectedExercise(Number(event.target.value))}>
                {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
              </select>
            </label>
            <NumberField label="Подходы" value={sets} onChange={setSets} />
            <NumberField label="Повторы" value={reps} onChange={setReps} />
            <NumberField label="Вес" value={weight} onChange={setWeight} />
            <button className="primary-button" type="submit" disabled={!selectedTemplate}>Добавить</button>
          </form>
          <List>
            {templateExercises.map((item) => (
              <li key={item.id}>
                <strong>{exercises.find((exercise) => exercise.id === item.exercise_id)?.name ?? `Упражнение ${item.exercise_id}`}</strong>
                <span>{item.sets} x {item.reps}, {item.weight} кг</span>
              </li>
            ))}
          </List>
        </section>
      </div>
      <section className="panel">
        <h2>История</h2>
        <List>
          {sessions.map((session) => (
            <li key={session.id}>
              <strong>Сессия #{session.id}</strong>
              <span>{session.duration_minutes || 0} мин, шаблон #{session.template_id}</span>
            </li>
          ))}
        </List>
      </section>
    </section>
  )
}

function NutritionPage() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [logs, setLogs] = useState<MealLog[]>([])
  const [goal, setGoal] = useState(2450)
  const [foodName, setFoodName] = useState('')
  const [foodCalories, setFoodCalories] = useState(180)
  const [selectedFood, setSelectedFood] = useState(1)
  const [grams, setGrams] = useState(150)
  const [mealType, setMealType] = useState('Обед')

  const load = useCallback(async () => {
    const [nextFoods, nextLogs, nextGoal] = await Promise.all([
      foodApi.list(userId),
      foodApi.logs(userId),
      foodApi.goal(userId).catch(() => null),
    ])
    setFoods(nextFoods)
    setLogs(nextLogs)
    setGoal(nextGoal?.daily_goal ?? 2450)
    setSelectedFood(nextFoods[0]?.id ?? 0)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function createFood(event: FormEvent) {
    event.preventDefault()
    await foodApi.create({ name: foodName, calories: foodCalories, protein: 12, fat: 4, carbs: 18, user_id: userId })
    setFoodName('')
    await load()
  }

  async function addLog(event: FormEvent) {
    event.preventDefault()
    await foodApi.addLog({ user_id: userId, food_id: selectedFood, grams, meal_type: mealType })
    await load()
  }

  async function saveGoal() {
    await foodApi.setGoal({ user_id: userId, daily_goal: goal, date: new Date().toISOString().slice(0, 10) })
    await load()
  }

  const totals = nutritionTotals(foods, logs)
  const chartData = [
    { name: 'Белки', value: totals.protein },
    { name: 'Жиры', value: totals.fat },
    { name: 'Углеводы', value: totals.carbs },
  ]

  return (
    <section className="page">
      <PageHeader title="Питание" subtitle="Дневник еды, продукты и дневная цель калорий." />
      <div className="metric-grid">
        <Metric title="Съедено" value={`${Math.round(totals.calories)} ккал`} caption={`цель ${goal} ккал`} />
        <Metric title="Белки" value={`${Math.round(totals.protein)} г`} caption="за сегодня" />
        <Metric title="Жиры" value={`${Math.round(totals.fat)} г`} caption="за сегодня" />
        <Metric title="Углеводы" value={`${Math.round(totals.carbs)} г`} caption="за сегодня" />
      </div>
      <div className="split-grid">
        <section className="panel">
          <h2>Дневник</h2>
          <form className="form-grid compact" onSubmit={addLog}>
            <label>
              Продукт
              <select value={selectedFood} onChange={(event) => setSelectedFood(Number(event.target.value))}>
                {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
              </select>
            </label>
            <NumberField label="Граммы" value={grams} onChange={setGrams} />
            <label>
              Прием пищи
              <input value={mealType} onChange={(event) => setMealType(event.target.value)} />
            </label>
            <button className="primary-button" type="submit">Добавить в дневник</button>
          </form>
          <List>
            {logs.map((log) => (
              <li key={log.id}>
                <strong>{foods.find((food) => food.id === log.food_id)?.name ?? `Продукт ${log.food_id}`}</strong>
                <span>{log.grams} г, {log.meal_type}</span>
              </li>
            ))}
          </List>
        </section>
        <section className="panel chart-panel">
          <h2>БЖУ</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
      <div className="split-grid">
        <form className="panel inline-form" onSubmit={createFood}>
          <input value={foodName} onChange={(event) => setFoodName(event.target.value)} placeholder="Новый продукт" required />
          <input type="number" value={foodCalories} onChange={(event) => setFoodCalories(Number(event.target.value))} />
          <button className="primary-button" type="submit">Добавить продукт</button>
        </form>
        <section className="panel inline-form">
          <input type="number" value={goal} onChange={(event) => setGoal(Number(event.target.value))} />
          <button className="secondary-button" type="button" onClick={() => void saveGoal()}>Сохранить цель</button>
        </section>
      </div>
    </section>
  )
}

function AiPage() {
  const { session } = useAuth()
  const [workoutNote, setWorkoutNote] = useState('')
  const [mealNote, setMealNote] = useState('')

  async function generateWorkout(event: FormEvent) {
    event.preventDefault()
    const response = await aiApi.workout({
      user_id: session?.userId ?? '',
      sex: 'male',
      weight: 78,
      level: 'intermediate',
      goal: 'strength',
      limitations: [],
      equipment: ['barbell', 'dumbbells'],
    })
    setWorkoutNote(response.note)
  }

  async function generateMeal(event: FormEvent) {
    event.preventDefault()
    const response = await aiApi.mealPlan({
      user_id: session?.userId ?? '',
      calories: 2400,
      preferences: ['high protein'],
      diet: 'balanced',
    })
    setMealNote(response.note)
  }

  return (
    <section className="page">
      <PageHeader title="AI генератор" subtitle="Формы готовы к API; текущий backend честно возвращает placeholder." />
      <div className="split-grid">
        <form className="panel form" onSubmit={generateWorkout}>
          <h2>Тренировка</h2>
          <p className="muted">Запрос уйдет в `/ai/generate-workout` с реальными полями Go handler.</p>
          <button className="primary-button" type="submit">Сгенерировать тренировку</button>
          {workoutNote ? <p className="notice">{workoutNote}</p> : null}
        </form>
        <form className="panel form" onSubmit={generateMeal}>
          <h2>Рацион</h2>
          <p className="muted">Запрос уйдет в `/ai/generate-meal-plan` с калориями и предпочтениями.</p>
          <button className="primary-button" type="submit">Сгенерировать рацион</button>
          {mealNote ? <p className="notice">{mealNote}</p> : null}
        </form>
      </div>
    </section>
  )
}

function CalculatorPage() {
  const [weight, setWeight] = useState(80)
  const [reps, setReps] = useState(5)
  const [oneRm, setOneRm] = useState<OneRmResponse | null>(null)
  const [percentage, setPercentage] = useState(75)
  const [working, setWorking] = useState<WorkingWeightResponse | null>(null)

  async function calculate(event: FormEvent) {
    event.preventDefault()
    const result = await calculatorApi.oneRm(weight, reps)
    setOneRm(result)
    setWorking(await calculatorApi.workingWeight(result.one_rm, percentage))
  }

  useEffect(() => {
    if (oneRm) calculatorApi.workingWeight(oneRm.one_rm, percentage).then(setWorking).catch(() => undefined)
  }, [oneRm, percentage])

  return (
    <section className="page">
      <PageHeader title="Калькулятор" subtitle="1ПМ по Epley и рабочие веса из backend endpoint." />
      <form className="panel form-grid" onSubmit={calculate}>
        <NumberField label="Вес, кг" value={weight} onChange={setWeight} />
        <NumberField label="Повторы" value={reps} onChange={setReps} />
        <label>
          Процент: {percentage}%
          <input type="range" min="50" max="100" value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} />
        </label>
        <button className="primary-button" type="submit">Рассчитать</button>
      </form>
      {oneRm ? (
        <div className="metric-grid">
          <Metric title="1ПМ" value={`${oneRm.one_rm} кг`} caption={oneRm.formula} />
          <Metric title="Рабочий вес" value={`${working?.working_weight ?? 0} кг`} caption={`${percentage}% от 1ПМ`} />
        </div>
      ) : null}
      {oneRm ? (
        <CardGrid>
          {Object.entries(oneRm.working_weights).map(([label, value]) => (
            <article className="item-card" key={label}>
              <strong>{label}</strong>
              <span>{value} кг</span>
            </article>
          ))}
        </CardGrid>
      ) : null}
    </section>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}

function Metric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <article className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  )
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list">{children}</ul>
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="card-grid">{children}</div>
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function nutritionTotals(foods: FoodItem[], logs: MealLog[]) {
  return logs.reduce(
    (totals, log) => {
      const food = foods.find((item) => item.id === log.food_id)
      if (!food) return totals
      const factor = log.grams / 100
      return {
        calories: totals.calories + food.calories * factor,
        protein: totals.protein + food.protein * factor,
        fat: totals.fat + food.fat * factor,
        carbs: totals.carbs + food.carbs * factor,
      }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  )
}

export default App
