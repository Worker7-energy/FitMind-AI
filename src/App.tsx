import {
  Activity,
  AlertCircle,
  Apple,
  Bot,
  Calculator,
  CheckCircle2,
  Dumbbell,
  Home,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
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

type Notice = { type: 'success' | 'error' | 'info'; text: string } | null

const navItems = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/profile', label: 'Профиль', icon: UserRound },
  { to: '/exercises', label: 'Упражнения', icon: Dumbbell },
  { to: '/workouts', label: 'Тренировки', icon: Activity },
  { to: '/nutrition', label: 'Питание', icon: Apple },
  { to: '/ai', label: 'AI-план', icon: Bot },
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
            <span>тренировки и питание без хаоса</span>
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [navigate, session])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    setIsLoading(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password)
      navigate('/', { replace: true })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось выполнить вход. Проверьте email и пароль.') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel product-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">FM</div>
          <div>
            <strong>FitMind AI</strong>
            <span>персональный фитнес-кабинет</span>
          </div>
        </div>
        <h1>Добро пожаловать</h1>
        <p className="muted">Войдите, чтобы вести тренировки, питание и прогресс в одном месте.</p>
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
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required />
          </label>
          <NoticeBox notice={notice} />
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="spin" size={18} /> : null}
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
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
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    Promise.all([
      profileApi.get(userId).then(setProfile).catch(() => setProfile(null)),
      workoutsApi.templates(userId).then(setTemplates),
      workoutsApi.sessions(userId).then(setSessions),
      foodApi.list(userId).then(setFoods),
      foodApi.logs(userId).then(setLogs),
      foodApi.goal(userId).then(setGoal).catch(() => setGoal(null)),
    ]).catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить главную страницу.') }))
  }, [userId])

  const calories = useMemo(() => nutritionTotals(foods, logs), [foods, logs])
  const chartData = useMemo(() => sessionsToChart(sessions), [sessions])
  const calorieGoal = goal?.daily_goal ?? profile?.daily_calories_goal ?? 0
  const lastSession = sessions.filter((item) => item.completed_at).at(-1)

  return (
    <section className="page">
      <PageHeader title="Главная" subtitle="Ваш текущий прогресс без лишнего шума." />
      <NoticeBox notice={notice} />
      <div className="metric-grid">
        <Metric title="Калории сегодня" value={calorieGoal ? `${Math.round(calories.calories)} / ${calorieGoal}` : `${Math.round(calories.calories)} ккал`} caption={calorieGoal ? 'по дневной цели' : 'цель пока не задана'} />
        <Metric title="Шаблоны" value={String(templates.length)} caption="готовых тренировок" />
        <Metric title="История" value={String(sessions.length)} caption="тренировочных сессий" />
        <Metric title="Профиль" value={profile ? `${profile.weight} кг` : 'не заполнен'} caption={profile ? `${profile.height} см, ${profile.age} лет` : 'добавьте данные'} />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <h2>Активность за 7 дней</h2>
          {sessions.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" stroke="#2f7d68" fill="#b9e6d5" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Пока нет тренировок" text="Когда вы завершите первую тренировку, здесь появится реальная динамика." />
          )}
        </section>
        <section className="panel">
          <h2>Последняя тренировка</h2>
          {lastSession ? (
            <List>
              <li>
                <strong>Сессия #{lastSession.id}</strong>
                <span>{lastSession.duration_minutes} мин</span>
              </li>
            </List>
          ) : (
            <EmptyState title="История пуста" text="Создайте шаблон и завершите тренировку, чтобы увидеть запись." />
          )}
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
    weight: 75,
    height: 175,
    age: 25,
    sex: 'male',
    activity_level: 3,
    daily_calories_goal: 2300,
  })
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    profileApi.get(userId).then((data) => data && setProfile(data)).catch(() => undefined)
  }, [userId])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    setIsSaving(true)
    try {
      await profileApi.save({ ...profile, user_id: userId })
      setNotice({ type: 'success', text: 'Профиль сохранен.' })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось сохранить профиль.') })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <PageHeader title="Профиль" subtitle="Эти данные помогают точнее считать калории и нагрузку." />
      <form className="panel form-grid" onSubmit={save}>
        <NumberField label="Вес, кг" min={30} max={250} value={profile.weight} onChange={(weight) => setProfile({ ...profile, weight })} />
        <NumberField label="Рост, см" min={100} max={230} value={profile.height} onChange={(height) => setProfile({ ...profile, height })} />
        <NumberField label="Возраст" min={12} max={100} value={profile.age} onChange={(age) => setProfile({ ...profile, age })} />
        <label>
          Пол
          <select value={profile.sex} onChange={(event) => setProfile({ ...profile, sex: event.target.value })}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </label>
        <NumberField label="Активность 1-5" min={1} max={5} value={profile.activity_level} onChange={(activity_level) => setProfile({ ...profile, activity_level })} />
        <NumberField label="Цель, ккал" min={900} max={6000} value={profile.daily_calories_goal} onChange={(daily_calories_goal) => setProfile({ ...profile, daily_calories_goal })} />
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={18} /> : null}Сохранить</button>
        <NoticeBox notice={notice} />
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
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    const list = query ? await exercisesApi.search(query) : await exercisesApi.ensureCatalog(session?.userId)
    setItems(list)
  }, [query, session?.userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить упражнения.') }))
  }, [load])

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    setIsSaving(true)
    try {
      await exercisesApi.create({ name: name.trim(), muscle_group: muscle.trim(), is_custom: true, created_by_user_id: session?.userId })
      setName('')
      setNotice({ type: 'success', text: 'Упражнение добавлено.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить упражнение.') })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <PageHeader title="Упражнения" subtitle="Справочник движений для ваших тренировок." />
      <NoticeBox notice={notice} />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название упражнения" />
        </div>
        <button className="secondary-button" type="button" onClick={() => void load()}>Найти</button>
      </div>
      <form className="panel inline-form" onSubmit={add}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например: Румынская тяга" minLength={2} required />
        <input value={muscle} onChange={(event) => setMuscle(event.target.value)} placeholder="Группа мышц" minLength={2} required />
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}Добавить</button>
      </form>
      {items.length ? (
        <CardGrid>
          {items.map((exercise) => (
            <article className="item-card" key={exercise.id}>
              <strong>{exercise.name}</strong>
              <span>{exercise.muscle_group}</span>
              <small>{exercise.is_custom ? 'Ваше упражнение' : 'Базовое упражнение'}</small>
            </article>
          ))}
        </CardGrid>
      ) : (
        <EmptyState title="Ничего не найдено" text="Измените поиск или добавьте упражнение вручную." />
      )}
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
  const [templateName, setTemplateName] = useState('')
  const [quickExerciseName, setQuickExerciseName] = useState('')
  const [quickExerciseMuscle, setQuickExerciseMuscle] = useState('Грудь')
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(0)
  const [sets, setSets] = useState(4)
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(40)
  const [duration, setDuration] = useState(45)
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    const [nextTemplates, nextExercises, nextSessions] = await Promise.all([
      workoutsApi.templates(userId),
      exercisesApi.ensureCatalog(userId),
      workoutsApi.sessions(userId),
    ])
    setTemplates(nextTemplates)
    setExercises(nextExercises)
    setSessions(nextSessions)
    setSelectedExercise((current) => current || nextExercises[0]?.id || 0)
    const templateId = selectedTemplate || nextTemplates[0]?.id || 0
    setSelectedTemplate(templateId)
    if (templateId) setTemplateExercises((await workoutsApi.templateDetails(templateId)).exercises)
    else setTemplateExercises([])
  }, [selectedTemplate, userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить тренировки.') }))
  }, [load])

  useEffect(() => {
    if (selectedTemplate) workoutsApi.templateDetails(selectedTemplate).then((details) => setTemplateExercises(details.exercises)).catch(() => setTemplateExercises([]))
  }, [selectedTemplate])

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    setIsSaving(true)
    try {
      const created = await workoutsApi.createTemplate(userId, templateName.trim())
      setTemplateName('')
      setSelectedTemplate(created.id)
      setNotice({ type: 'success', text: 'Тренировка создана.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось создать тренировку.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function createQuickExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    try {
      const created = await exercisesApi.create({ name: quickExerciseName.trim(), muscle_group: quickExerciseMuscle.trim(), is_custom: true, created_by_user_id: userId })
      setQuickExerciseName('')
      setSelectedExercise(created.id)
      setNotice({ type: 'success', text: 'Упражнение добавлено в справочник.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось создать упражнение.') })
    }
  }

  async function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    if (!selectedTemplate) {
      setNotice({ type: 'error', text: 'Сначала создайте или выберите тренировку.' })
      return
    }
    if (!selectedExercise) {
      setNotice({ type: 'error', text: 'Выберите упражнение.' })
      return
    }
    try {
      await workoutsApi.addExercise({ template_id: selectedTemplate, exercise_id: selectedExercise, sets, reps, weight, order_index: templateExercises.length + 1 })
      setNotice({ type: 'success', text: 'Упражнение добавлено в тренировку.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить упражнение в тренировку.') })
    }
  }

  async function startAndComplete(templateId: number) {
    setNotice(null)
    try {
      const session = await workoutsApi.startSession(userId, templateId)
      await workoutsApi.completeSession(session.id, duration)
      setNotice({ type: 'success', text: 'Тренировка сохранена в истории.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось завершить тренировку.') })
    }
  }

  return (
    <section className="page">
      <PageHeader title="Тренировки" subtitle="Создавайте шаблоны и сохраняйте завершенные занятия." />
      <NoticeBox notice={notice} />
      <div className="split-grid">
        <section className="panel">
          <h2>Мои тренировки</h2>
          <form className="inline-form two" onSubmit={createTemplate}>
            <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Название тренировки" minLength={2} required />
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}Создать</button>
          </form>
          {templates.length ? (
            <List>
              {templates.map((template) => (
                <li key={template.id} className={selectedTemplate === template.id ? 'selected-row' : ''}>
                  <button type="button" onClick={() => setSelectedTemplate(template.id)}>{template.name}</button>
                  <button type="button" className="secondary-button" onClick={() => void startAndComplete(template.id)}>Завершить</button>
                </li>
              ))}
            </List>
          ) : (
            <EmptyState title="Шаблонов пока нет" text="Создайте первую тренировку и добавьте упражнения." />
          )}
          <label className="range-label">
            Длительность: {duration} мин
            <input type="range" min="15" max="120" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
        </section>
        <section className="panel">
          <h2>Состав тренировки</h2>
          <form className="form-grid compact" onSubmit={addExercise}>
            <label>
              Упражнение
              <select value={selectedExercise} onChange={(event) => setSelectedExercise(Number(event.target.value))} required>
                {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
              </select>
            </label>
            <NumberField label="Подходы" min={1} max={12} value={sets} onChange={setSets} />
            <NumberField label="Повторы" min={1} max={100} value={reps} onChange={setReps} />
            <NumberField label="Вес, кг" min={0} max={500} step={0.5} value={weight} onChange={setWeight} />
            <button className="primary-button" type="submit">Добавить</button>
          </form>
          <form className="inline-form two subtle-form" onSubmit={createQuickExercise}>
            <input value={quickExerciseName} onChange={(event) => setQuickExerciseName(event.target.value)} placeholder="Добавить новое упражнение" minLength={2} required />
            <input value={quickExerciseMuscle} onChange={(event) => setQuickExerciseMuscle(event.target.value)} placeholder="Группа мышц" minLength={2} required />
            <button className="secondary-button" type="submit">В справочник</button>
          </form>
          {templateExercises.length ? (
            <List>
              {templateExercises.map((item) => (
                <li key={item.id}>
                  <strong>{exercises.find((exercise) => exercise.id === item.exercise_id)?.name ?? `Упражнение ${item.exercise_id}`}</strong>
                  <span>{item.sets} x {item.reps}, {item.weight} кг</span>
                </li>
              ))}
            </List>
          ) : (
            <EmptyState title="Состав пуст" text="Выберите упражнение и добавьте его в выбранную тренировку." />
          )}
        </section>
      </div>
      <section className="panel">
        <h2>История</h2>
        {sessions.length ? (
          <List>{sessions.map((item) => <li key={item.id}><strong>Сессия #{item.id}</strong><span>{item.duration_minutes || 0} мин</span></li>)}</List>
        ) : (
          <EmptyState title="Пока нет записей" text="Завершенные тренировки будут появляться здесь." />
        )}
      </section>
    </section>
  )
}

function NutritionPage() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [logs, setLogs] = useState<MealLog[]>([])
  const [goal, setGoal] = useState(2400)
  const [foodName, setFoodName] = useState('')
  const [foodCalories, setFoodCalories] = useState(120)
  const [foodProtein, setFoodProtein] = useState(10)
  const [foodFat, setFoodFat] = useState(3)
  const [foodCarbs, setFoodCarbs] = useState(12)
  const [selectedFood, setSelectedFood] = useState(0)
  const [grams, setGrams] = useState(100)
  const [mealType, setMealType] = useState('Обед')
  const [notice, setNotice] = useState<Notice>(null)

  const load = useCallback(async () => {
    const [nextFoods, nextLogs, nextGoal] = await Promise.all([
      foodApi.list(userId),
      foodApi.logs(userId),
      foodApi.goal(userId).catch(() => null),
    ])
    setFoods(nextFoods)
    setLogs(nextLogs)
    setGoal(nextGoal?.daily_goal ?? 2400)
    setSelectedFood((current) => current || nextFoods[0]?.id || 0)
  }, [userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить питание.') }))
  }, [load])

  async function createFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    try {
      const created = await foodApi.create({ name: foodName.trim(), calories: foodCalories, protein: foodProtein, fat: foodFat, carbs: foodCarbs, user_id: userId })
      setFoodName('')
      setSelectedFood(created.id)
      setNotice({ type: 'success', text: 'Продукт добавлен.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить продукт.') })
    }
  }

  async function addLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    if (!selectedFood) {
      setNotice({ type: 'error', text: 'Сначала добавьте или выберите продукт.' })
      return
    }
    try {
      await foodApi.addLog({ user_id: userId, food_id: selectedFood, grams, meal_type: mealType.trim() })
      setNotice({ type: 'success', text: 'Прием пищи добавлен.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить запись питания.') })
    }
  }

  async function saveGoal() {
    setNotice(null)
    if (goal < 900) {
      setNotice({ type: 'error', text: 'Цель калорий должна быть не меньше 900 ккал.' })
      return
    }
    try {
      await foodApi.setGoal({ user_id: userId, daily_goal: goal, date: new Date().toISOString().slice(0, 10) })
      setNotice({ type: 'success', text: 'Цель сохранена.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось сохранить цель.') })
    }
  }

  const totals = nutritionTotals(foods, logs)
  const chartData = [
    { name: 'Белки', value: totals.protein },
    { name: 'Жиры', value: totals.fat },
    { name: 'Углеводы', value: totals.carbs },
  ]

  return (
    <section className="page">
      <PageHeader title="Питание" subtitle="Ведите дневник еды и контролируйте дневную цель." />
      <NoticeBox notice={notice} />
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
              <select value={selectedFood} onChange={(event) => setSelectedFood(Number(event.target.value))} disabled={!foods.length} required>
                {!foods.length ? <option value={0}>Сначала добавьте продукт</option> : null}
                {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
              </select>
            </label>
            <NumberField label="Граммы" min={1} max={5000} value={grams} onChange={setGrams} />
            <label>
              Прием пищи
              <input value={mealType} onChange={(event) => setMealType(event.target.value)} minLength={2} required />
            </label>
            <button className="primary-button" type="submit" disabled={!foods.length}>Добавить</button>
          </form>
          {logs.length ? (
            <List>
              {logs.map((log) => <li key={log.id}><strong>{foods.find((food) => food.id === log.food_id)?.name ?? `Продукт ${log.food_id}`}</strong><span>{log.grams} г, {log.meal_type}</span></li>)}
            </List>
          ) : (
            <EmptyState title="Дневник пуст" text="Добавьте продукт и запишите первый прием пищи." />
          )}
        </section>
        <section className="panel chart-panel">
          <h2>Баланс БЖУ</h2>
          {logs.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2f7d68" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Нет данных" text="Диаграмма появится после первой записи питания." />
          )}
        </section>
      </div>
      <form className="panel form-grid compact" onSubmit={createFood}>
        <input value={foodName} onChange={(event) => setFoodName(event.target.value)} placeholder="Название продукта" minLength={2} required />
        <NumberField label="Ккал на 100 г" min={0} max={1200} value={foodCalories} onChange={setFoodCalories} />
        <NumberField label="Белки" min={0} max={100} step={0.1} value={foodProtein} onChange={setFoodProtein} />
        <NumberField label="Жиры" min={0} max={100} step={0.1} value={foodFat} onChange={setFoodFat} />
        <NumberField label="Углеводы" min={0} max={100} step={0.1} value={foodCarbs} onChange={setFoodCarbs} />
        <button className="primary-button" type="submit"><Plus size={18} />Добавить продукт</button>
      </form>
      <section className="panel inline-form two">
        <NumberField label="Дневная цель, ккал" min={900} max={6000} value={goal} onChange={setGoal} />
        <button className="secondary-button" type="button" onClick={() => void saveGoal()}>Сохранить цель</button>
      </section>
    </section>
  )
}

function AiPage() {
  const { session } = useAuth()
  const [workoutNote, setWorkoutNote] = useState<Notice>(null)
  const [mealNote, setMealNote] = useState<Notice>(null)
  const [isWorkoutLoading, setWorkoutLoading] = useState(false)
  const [isMealLoading, setMealLoading] = useState(false)

  async function generateWorkout(event: FormEvent) {
    event.preventDefault()
    setWorkoutNote(null)
    setWorkoutLoading(true)
    try {
      const response = await aiApi.workout({ user_id: session?.userId ?? '', sex: 'male', weight: 78, level: 'intermediate', goal: 'strength', limitations: [], equipment: ['barbell', 'dumbbells'] })
      setWorkoutNote({ type: 'success', text: response.note ?? response.error ?? 'План тренировки готов.' })
    } catch (error) {
      setWorkoutNote({ type: 'error', text: apiError(error, 'Сервис AI сейчас недоступен. Попробуйте позже.') })
    } finally {
      setWorkoutLoading(false)
    }
  }

  async function generateMeal(event: FormEvent) {
    event.preventDefault()
    setMealNote(null)
    setMealLoading(true)
    try {
      const response = await aiApi.mealPlan({ user_id: session?.userId ?? '', calories: 2400, preferences: ['high protein'], diet: 'balanced' })
      setMealNote({ type: 'success', text: response.note ?? response.error ?? 'План питания готов.' })
    } catch (error) {
      setMealNote({ type: 'error', text: apiError(error, 'Сервис AI сейчас недоступен. Попробуйте позже.') })
    } finally {
      setMealLoading(false)
    }
  }

  return (
    <section className="page">
      <PageHeader title="AI-план" subtitle="Подготовьте тренировку или рацион на основе ваших целей." />
      <div className="split-grid">
        <form className="panel feature-panel" onSubmit={generateWorkout}>
          <Sparkles size={28} />
          <h2>План тренировки</h2>
          <p className="muted">Подойдет, когда нужно быстро собрать занятие под цель и доступное оборудование.</p>
          <button className="primary-button" type="submit" disabled={isWorkoutLoading}>{isWorkoutLoading ? <Loader2 className="spin" size={18} /> : null}Сгенерировать</button>
          <NoticeBox notice={workoutNote} />
        </form>
        <form className="panel feature-panel" onSubmit={generateMeal}>
          <Sparkles size={28} />
          <h2>План питания</h2>
          <p className="muted">Поможет набросать рацион по калориям и предпочтениям.</p>
          <button className="primary-button" type="submit" disabled={isMealLoading}>{isMealLoading ? <Loader2 className="spin" size={18} /> : null}Сгенерировать</button>
          <NoticeBox notice={mealNote} />
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
  const [notice, setNotice] = useState<Notice>(null)

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!event.currentTarget.reportValidity()) return
    try {
      const result = await calculatorApi.oneRm(weight, reps)
      setOneRm(result)
      setWorking(await calculatorApi.workingWeight(result.one_rm, percentage))
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось рассчитать веса.') })
    }
  }

  useEffect(() => {
    if (oneRm) calculatorApi.workingWeight(oneRm.one_rm, percentage).then(setWorking).catch(() => undefined)
  }, [oneRm, percentage])

  return (
    <section className="page">
      <PageHeader title="Калькулятор нагрузок" subtitle="Оцените 1ПМ и рабочие веса для подходов." />
      <NoticeBox notice={notice} />
      <form className="panel form-grid" onSubmit={calculate}>
        <NumberField label="Вес, кг" min={1} max={500} step={0.5} value={weight} onChange={setWeight} />
        <NumberField label="Повторы" min={1} max={30} value={reps} onChange={setReps} />
        <label>
          Интенсивность: {percentage}%
          <input type="range" min="50" max="100" value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} />
        </label>
        <button className="primary-button" type="submit">Рассчитать</button>
      </form>
      {oneRm ? (
        <>
          <div className="metric-grid">
            <Metric title="Расчетный 1ПМ" value={`${oneRm.one_rm} кг`} caption={oneRm.formula} />
            <Metric title="Рабочий вес" value={`${working?.working_weight ?? 0} кг`} caption={`${percentage}% от 1ПМ`} />
          </div>
          <CardGrid>
            {Object.entries(oneRm.working_weights).map(([label, value]) => (
              <article className="item-card compact-card" key={label}><strong>{prettyWeightLabel(label)}</strong><span>{value} кг</span></article>
            ))}
          </CardGrid>
        </>
      ) : (
        <EmptyState title="Введите вес и повторы" text="Результаты появятся после расчета." />
      )}
    </section>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div></header>
}

function Metric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return <article className="metric-card"><span>{title}</span><strong>{value}</strong><small>{caption}</small></article>
}

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null
  const Icon = notice.type === 'success' ? CheckCircle2 : notice.type === 'error' ? AlertCircle : Sparkles
  return <p className={`notice ${notice.type}`}><Icon size={17} />{notice.text}</p>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><strong>{title}</strong><span>{text}</span></div>
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list">{children}</ul>
}

function CardGrid({ children }: { children: ReactNode }) {
  return <div className="card-grid">{children}</div>
}

function NumberField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label>
      {label}
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} required />
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

function sessionsToChart(sessions: WorkoutSession[]) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => ({ day, minutes: 0 }))
  for (const session of sessions) {
    const date = new Date(session.completed_at ?? session.started_at)
    const index = (date.getDay() + 6) % 7
    days[index].minutes += session.duration_minutes || 0
  }
  return days
}

function prettyWeightLabel(label: string) {
  const dictionary: Record<string, string> = {
    warmup_50: 'Разминка 50%',
    warmup_60: 'Разминка 60%',
    light_65: 'Легко 65%',
    moderate_70: 'Умеренно 70%',
    medium_75: 'Средне 75%',
    heavy_80: 'Тяжело 80%',
    very_heavy_85: 'Очень тяжело 85%',
    max_effort_90: 'Максимум 90%',
    near_max_95: 'Почти максимум 95%',
  }
  return dictionary[label] ?? label
}

function apiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(error.message) as { error?: string; note?: string }
    return parsed.note ? `${parsed.note}: ${parsed.error ?? fallback}` : (parsed.error ?? fallback)
  } catch {
    return error.message || fallback
  }
}

export default App
