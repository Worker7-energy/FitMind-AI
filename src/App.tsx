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
import { aiApi, calculatorApi, exercisesApi, foodApi, profileApi, workoutsApi, saveAiFood, saveAiMealPlan, saveAiWorkout, saveSingleAiExercise, exerciseExists, templateExists, findFoodByName, foodExists, } from './api/mainApi'
import { useAuth } from './auth/AuthContext'
import { loadAiCache, saveAiCache } from './utils/aiCache'
import heroImage from './assets/hero.jpg'
import logoIcon from './assets/logo.jpg'
import type {
  AiMealPlanRequest,
  AiWorkoutRequest,
  CalorieGoal,
  Exercise,
  FitnessProfile,
  FoodItem,
  MealLog,
  OneRmResponse,
  WorkingWeightResponse,
  WorkoutExercise,
  WorkoutSession,
  WorkoutTemplate,
  AiMealResponse,
  AiWorkoutResponse
} from './types'


type Notice = { type: 'success' | 'error' | 'info'; text: string } | null

const muscleGroups = ['грудь', 'спина', 'ноги', 'плечи', 'руки', 'кор', 'кардио', 'другое']
const mealTypes = ['Завтрак', 'Обед', 'Ужин', 'Перекус']

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
  const userEmail = session?.email ?? ''
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
          <div className="brand-mark">
            <img src={logoIcon} alt="FitMind AI Logo" />
          </div>
          <div>
            <strong>FitMind AI</strong>
            <span>тренировки, питание и прогресс</span>
          </div>
        </div>
        <div>
          <h3>{userEmail}</h3>
        </div>
        <nav className="nav" aria-label="Основная навигация">
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
  const { session, login, register, sendVerification, verifyEmail, loginWithGoogle, loginWithYandex } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'code' | 'register'>('email')
  const [verificationCode, setVerificationCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [navigate, session])

  async function handleSendCode(e: FormEvent) {
      e.preventDefault()
      setNotice(null)
      if (!email.trim()) return

      setIsSendingCode(true)
      try {
        await sendVerification(email.trim())
        setStep('code')
        setNotice({ type: 'success', text: 'Код отправлен на ваш email' })
      } catch (error: any) {
        setNotice({ type: 'error', text: error?.message || 'Не удалось отправить код' })
      } finally {
        setIsSendingCode(false)
      }
    }

    // Подтверждение кода
    async function handleVerifyCode(e: FormEvent) {
      e.preventDefault()
      setNotice(null)

      setIsVerifying(true)
      try {
        await verifyEmail(email.trim(), verificationCode.trim())
        setStep('register')
        setNotice({ type: 'success', text: 'Email подтверждён! Придумайте пароль' })
      } catch (error: any) {
        setNotice({ type: 'error', text: error?.message || 'Неверный код' })
      } finally {
        setIsVerifying(false)
      }
    }

    // Финальная регистрация с паролем
    async function handleRegister(e: FormEvent) {
      e.preventDefault()
      setNotice(null)
      if (!ensureForm(e.currentTarget, setNotice)) return

      setIsLoading(true)
      try {
        await register(email.trim(), password)
        navigate('/', { replace: true })
      } catch (error: any) {
        setNotice({ type: 'error', text: error?.message || 'Не удалось зарегистрироваться' })
      } finally {
        setIsLoading(false)
      }
    }

    // Вход
    async function handleLogin(e: FormEvent) {
      e.preventDefault()
      setNotice(null)
      if (!ensureForm(e.currentTarget, setNotice)) return

      setIsLoading(true)
      try {
        await login(email.trim(), password)
        navigate('/', { replace: true })
      } catch (error: any) {
        setNotice({ type: 'error', text: error?.message || 'Неверный email или пароль' })
      } finally {
        setIsLoading(false)
      }
    }


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

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
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="brand auth-brand">
          <div className="brand-mark">
            <img src={logoIcon} alt="FitMind AI Logo" />
          </div>            <div>
              <strong>FitMind AI</strong>
              <span>личный фитнес-кабинет</span>
            </div>
          </div>
          <h2>Ваш персональный AI-тренер и помощник по питанию</h2>
          <p>Планируйте тренировки, ведите дневник питания и получайте персональные рекомендации на основе ваших целей.</p>
        </div>
        <div className="auth-visual" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
        <div className="auth-form-box">
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Вход
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Регистрация
            </button>
          </div>
          {mode === 'login' ? (
          <form className="form" onSubmit={submit}>
            <label>
              Почта
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
            </label>
            <label>
              Пароль
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
            </label>
            <NoticeBox notice={notice} />
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="spin" size={18} /> : null}
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
            <button
                type="button"
                className="oauth-button google"
                onClick={loginWithGoogle}
              >
                Войти через Google
              </button>
              <button
                type="button"
                className="oauth-button yandex"
                onClick={loginWithYandex}
              >
                Войти через Яндекс
              </button>
          </form>
            ) : (
              <>
                {step === 'email' && (
                  <form className="form" onSubmit={handleSendCode}>
                    <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
                    <button className="primary-button" type="submit" disabled={isSendingCode}>
                      {isSendingCode ? <Loader2 className="spin" size={18} /> : null}Отправить код
                    </button>
                  </form>
                )}

                {step === 'code' && (
                  <form className="form" onSubmit={handleVerifyCode}>
                    <p className="code-hint">Код отправлен на {email}</p>
                    <label>Код подтверждения<input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} type="text" maxLength={6} placeholder="000000" required /></label>
                    <button className="primary-button" type="submit" disabled={isVerifying}>
                      {isVerifying ? <Loader2 className="spin" size={18} /> : null}Подтвердить email
                    </button>
                  </form>
                )}

                {step === 'register' && (
                  <form className="form" onSubmit={handleRegister}>
                    <label>Email<input value={email} type="email" disabled /></label>
                    <label>Пароль<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required /></label>
                    <button className="primary-button" type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="spin" size={18} /> : null}Зарегистрироваться
                    </button>
                  </form>
                )}
              </>
            )}

        </div>
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
      profileApi.get(userId).then(setProfile),
      workoutsApi.templates(userId).then(setTemplates),
      workoutsApi.sessions(userId).then(setSessions),
      foodApi.list(userId).then(setFoods),
      foodApi.logs(userId).then(setLogs),
      foodApi.goal(userId).then(setGoal),
    ]).catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить главную страницу.') }))
  }, [userId])

  const calories = useMemo(() => nutritionTotals(foods, logs), [foods, logs])
  const chartData = useMemo(() => sessionsToChart(sessions), [sessions])
  const hasChartData = chartData.some((item) => item.minutes > 0)
  const calorieGoal = goal?.daily_goal ?? profile?.daily_calories_goal ?? 0
  const completedSessions = sessions.filter((item) => item.completed_at)
  const lastSession = completedSessions.at(-1)

  return (
    <section className="page">
      <PageHeader title="Главная" subtitle="Короткая сводка по реальным данным аккаунта." />
      <NoticeBox notice={notice} />
      <div className="metric-grid">
        <Metric title="Калории сегодня" value={calorieGoal ? `${Math.round(calories.calories)} / ${calorieGoal}` : `${Math.round(calories.calories)} ккал`} caption={calorieGoal ? 'по дневной цели' : 'цель пока не задана'} />
        <Metric title="Шаблоны" value={String(templates.length)} caption="готовых тренировок" />
        <Metric title="История" value={String(completedSessions.length)} caption="завершенных тренировок" />
        <Metric title="Профиль" value={profile ? `${profile.weight} кг` : 'не заполнен'} caption={profile ? `${profile.height} см, ${profile.age} лет` : 'добавьте исходные данные'} />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <h2>Активность за 7 дней</h2>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" name="Минуты" stroke="#1f8a70" fill="#9ad8c7" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Пока нет тренировок" text="Здесь появится график только после завершенной тренировки." />
          )}
        </section>
        <section className="panel">
          <h2>Последняя тренировка</h2>
          {lastSession ? (
            <List>
              <li>
                <strong>{templateName(templates, lastSession.template_id)}</strong>
                <span>{lastSession.duration_minutes || 0} мин</span>
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
    profileApi.get(userId).then((data) => {
      if (data) setProfile(data)
      else setProfile((current) => ({ ...current, user_id: userId }))
    }).catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить профиль.') }))
  }, [userId])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

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
      <PageHeader title="Профиль" subtitle="Ваши данные для расчёта калорий и AI-рекомендаций" />
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
    const list = query.trim() ? await exercisesApi.search(query.trim()) : await exercisesApi.ensureCatalog(session?.userId)
    setItems(list)
  }, [query, session?.userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить упражнения.') }))
  }, [load])

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

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
      <PageHeader title="Упражнения" subtitle="Каталог упражнений для шаблонов тренировок." />
      <NoticeBox notice={notice} />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название упражнения" />
        </div>
        <button className="secondary-button" type="button" onClick={() => void load()}>Найти</button>
      </div>
      <form className="panel inline-form" onSubmit={add}>
        <label>
          Новое упражнение
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например: Румынская тяга" minLength={2} required />
        </label>
        <label>
          Группа мышц
          <select value={muscle} onChange={(event) => setMuscle(event.target.value)}>
            {muscleGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </label>
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
  const [templateNameInput, setTemplateNameInput] = useState('')
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
    setSelectedTemplate((current) => (nextTemplates.some((item) => item.id === current) ? current : nextTemplates[0]?.id ?? 0))
    setSelectedExercise((current) => (nextExercises.some((item) => item.id === current) ? current : nextExercises[0]?.id ?? 0))
  }, [userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить тренировки.') }))
  }, [load])

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateExercises([])
      return
    }
    workoutsApi.templateDetails(selectedTemplate)
      .then((details) => setTemplateExercises(details.exercises))
      .catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить упражнения шаблона.') }))
  }, [selectedTemplate])

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

    setIsSaving(true)
    try {
      const template = await workoutsApi.createTemplate(userId, templateNameInput.trim())
      setTemplates((current) => [...current, template])
      setTemplateNameInput('')
      setSelectedTemplate(template.id)
      setNotice({ type: 'success', text: 'Шаблон тренировки создан.' })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось создать шаблон.') })
    } finally {
      setIsSaving(false)
    }
  }

  // Функция удаления шаблона
  async function deleteTemplate(templateId: number, templateName: string) {
    if (!confirm(`Удалить шаблон "${templateName}"?`)) return
    
    setIsSaving(true)
    try {
      await workoutsApi.deleteTemplate(templateId)
      
      // Обновляем список шаблонов
      const newTemplates = templates.filter(t => t.id !== templateId)
      setTemplates(newTemplates)
      
      // Если удалили выбранный шаблон, выбираем первый из оставшихся или сбрасываем
      if (selectedTemplate === templateId) {
        setSelectedTemplate(newTemplates[0]?.id ?? 0)
        setTemplateExercises([])
      }
      
      setNotice({ type: 'success', text: `Шаблон "${templateName}" удалён.` })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось удалить шаблон.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteExerciseFromTemplate(workoutExerciseId: number, exerciseName: string) {
    if (!confirm(`Удалить упражнение "${exerciseName}" из шаблона?`)) return
    
    setIsSaving(true)
    try {
      await workoutsApi.deleteExerciseFromTemplate(workoutExerciseId)
      
      // Обновляем список упражнений в шаблоне
      setTemplateExercises((current) => current.filter((item) => item.id !== workoutExerciseId))
      
      setNotice({ type: 'success', text: `Упражнение "${exerciseName}" удалено из шаблона.` })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось удалить упражнение.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function createQuickExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

    setIsSaving(true)
    try {
      const exercise = await exercisesApi.create({
        name: quickExerciseName.trim(),
        muscle_group: quickExerciseMuscle,
        is_custom: true,
        created_by_user_id: userId,
      })
      setExercises((current) => [...current, exercise])
      setQuickExerciseName('')
      setSelectedExercise(exercise.id)
      setNotice({ type: 'success', text: 'Упражнение создано и выбрано.' })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось создать упражнение.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function addWorkoutExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return
    if (!selectedTemplate) {
      setNotice({ type: 'error', text: 'Сначала создайте или выберите шаблон тренировки.' })
      return
    }
    if (!selectedExercise) {
      setNotice({ type: 'error', text: 'Выберите упражнение или создайте новое.' })
      return
    }

    setIsSaving(true)
    try {
      const item = await workoutsApi.addExercise({
        template_id: selectedTemplate,
        exercise_id: selectedExercise,
        sets,
        reps,
        weight,
        order_index: templateExercises.length + 1,
      })
      setTemplateExercises((current) => [...current, item])
      setNotice({ type: 'success', text: 'Упражнение добавлено в тренировку.' })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить упражнение в тренировку.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function finishWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return
    if (!selectedTemplate) {
      setNotice({ type: 'error', text: 'Сначала выберите шаблон тренировки.' })
      return
    }
    if (!templateExercises.length) {
      setNotice({ type: 'error', text: 'Добавьте хотя бы одно упражнение в шаблон.' })
      return
    }

    setIsSaving(true)
    try {
      const sessionRecord = await workoutsApi.startSession(userId, selectedTemplate)
      await workoutsApi.completeSession(sessionRecord.id, duration)
      await Promise.all(templateExercises.map((item) =>
        workoutsApi.saveResult({
          session_id: sessionRecord.id,
          exercise_id: item.exercise_id,
          sets_done: item.sets,
          reps_done: item.reps,
          weight_used: item.weight,
        }).catch(() => undefined),
      ))
      setSessions(await workoutsApi.sessions(userId))
      setNotice({ type: 'success', text: 'Тренировка записана в историю.' })
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось завершить тренировку.') })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <PageHeader title="Тренировки" subtitle="Создавайте шаблоны, добавляйте упражнения и фиксируйте завершенные занятия." />
      <NoticeBox notice={notice} />
      <div className="split-grid">
        <section className="panel">
          <h2>Шаблоны</h2>
          <form className="inline-form two" onSubmit={createTemplate}>
            <label>
              Название шаблона
              <input value={templateNameInput} onChange={(event) => setTemplateNameInput(event.target.value)} placeholder="Например: Верх тела" minLength={2} required />
            </label>
            <button className="primary-button" type="submit" disabled={isSaving}><Plus size={18} />Создать</button>
          </form>
          {templates.length ? (
            <div className="templates-list">
              {templates.map((template) => (
                <div key={template.id} className={`template-item ${template.id === selectedTemplate ? 'selected' : ''}`}>
                  <button 
                    type="button" 
                    className="template-select-btn"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    {template.name}
                  </button>
                  <div className="template-actions">
                    <span className="template-status">
                      {template.id === selectedTemplate ? 'выбран' : ''}
                    </span>
                    <button
                      type="button"
                      className="delete-template-btn"
                      onClick={() => deleteTemplate(template.id, template.name)}
                      title="Удалить шаблон"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Шаблонов пока нет" text="Создайте первый шаблон, затем добавьте в него упражнения." />
          )}
        </section>

        <section className="panel">
          <h2>Быстро создать упражнение</h2>
          <form className="form-grid compact" onSubmit={createQuickExercise}>
            <label>
              Название
              <input value={quickExerciseName} onChange={(event) => setQuickExerciseName(event.target.value)} placeholder="Например: Тяга гантели" minLength={2} required />
            </label>
            <label>
              Группа
              <select value={quickExerciseMuscle} onChange={(event) => setQuickExerciseMuscle(event.target.value)}>
                {muscleGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </label>
            <button className="secondary-button" type="submit" disabled={isSaving}><Plus size={18} />Создать</button>
          </form>
        </section>
      </div>

      <section className="panel">
        <h2>Состав тренировки</h2>
        <form className="form-grid workout-builder" onSubmit={addWorkoutExercise}>
          <label>
            Упражнение
            <select value={selectedExercise} onChange={(event) => setSelectedExercise(Number(event.target.value))} required>
              {!exercises.length ? <option value={0}>Создайте упражнение выше</option> : null}
              {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name} · {exercise.muscle_group}</option>)}
            </select>
          </label>
          <NumberField label="Подходы" min={1} max={20} value={sets} onChange={setSets} />
          <NumberField label="Повторы" min={1} max={100} value={reps} onChange={setReps} />
          <NumberField label="Вес, кг" min={0} max={500} step={0.5} value={weight} onChange={setWeight} />
          <button className="primary-button" type="submit" disabled={isSaving}><Plus size={18} />Добавить в шаблон</button>
        </form>
        
        {templateExercises.length ? (
          <div className="exercises-list">
            {templateExercises.map((item) => (
              <div key={item.id} className="exercise-item">
                <div className="exercise-info">
                  <strong>{exerciseName(exercises, item.exercise_id)}</strong>
                  <span>{item.sets} x {item.reps}, {item.weight} кг</span>
                </div>
                <button
                  type="button"
                  className="delete-exercise-btn"
                  onClick={() => deleteExerciseFromTemplate(item.id, exerciseName(exercises, item.exercise_id))}
                  title="Удалить упражнение из шаблона"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="В выбранном шаблоне нет упражнений" text="Выберите упражнение из каталога или создайте свое." />
        )}
      </section>

      <div className="split-grid">
        <section className="panel">
          <h2>Завершить тренировку</h2>
          <form className="inline-form two" onSubmit={finishWorkout}>
            <NumberField label="Длительность, мин" min={1} max={360} value={duration} onChange={setDuration} />
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={18} /> : null}Записать в историю</button>
          </form>
        </section>
        <section className="panel">
          <h2>История</h2>
          {sessions.filter((item) => item.completed_at).length ? (
            <List>
              {sessions.filter((item) => item.completed_at).map((item) => (
                <li key={item.id}>
                  <strong>{templateName(templates, item.template_id)}</strong>
                  <span>{item.duration_minutes || 0} мин</span>
                </li>
              ))}
            </List>
          ) : (
            <EmptyState title="Пока нет записей" text="Завершенные тренировки будут появляться здесь." />
          )}
        </section>
      </div>
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
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    const [nextFoods, nextLogs, nextGoal] = await Promise.all([
      foodApi.list(userId),
      foodApi.logs(userId),
      foodApi.goal(userId),
    ])
    setFoods(nextFoods)
    setLogs(nextLogs)
    setGoal(nextGoal?.daily_goal ?? 2400)
    setSelectedFood((current) => (nextFoods.some((item) => item.id === current) ? current : nextFoods[0]?.id ?? 0))
  }, [userId])

  useEffect(() => {
    load().catch((error) => setNotice({ type: 'error', text: apiError(error, 'Не удалось загрузить питание.') }))
  }, [load])

  async function createFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

    setIsSaving(true)
    try {
      const created = await foodApi.create({ name: foodName.trim(), calories: foodCalories, protein: foodProtein, fat: foodFat, carbs: foodCarbs, user_id: userId })
      setFoodName('')
      setSelectedFood(created.id)
      setNotice({ type: 'success', text: 'Продукт добавлен.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить продукт.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function addLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return
    if (!selectedFood) {
      setNotice({ type: 'error', text: 'Сначала добавьте или выберите продукт.' })
      return
    }

    setIsSaving(true)
    try {
      await foodApi.addLog({ user_id: userId, food_id: selectedFood, grams, meal_type: mealType.trim() })
      setNotice({ type: 'success', text: 'Прием пищи добавлен.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось добавить запись питания.') })
    } finally {
      setIsSaving(false)
    }
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

    setIsSaving(true)
    try {
      await foodApi.setGoal({ user_id: userId, daily_goal: goal, date: new Date().toISOString().slice(0, 10) })
      setNotice({ type: 'success', text: 'Цель сохранена.' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось сохранить цель.') })
    } finally {
      setIsSaving(false)
    }
  }

  const totals = nutritionTotals(foods, logs)
  const chartData = [
    { name: 'Белки', value: Math.round(totals.protein) },
    { name: 'Жиры', value: Math.round(totals.fat) },
    { name: 'Углеводы', value: Math.round(totals.carbs) },
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
                {!foods.length ? <option value={0}>Добавьте продукт ниже</option> : null}
                {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
              </select>
            </label>
            <NumberField label="Граммы" min={1} max={5000} value={grams} onChange={setGrams} />
            <label>
              Прием пищи
              <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
                {mealTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={18} /> : null}Добавить</button>
          </form>
          {logs.length ? (
            <List>
              {logs.map((log) => (
                <li key={log.id}>
                  <strong>{foods.find((food) => food.id === log.food_id)?.name ?? `Продукт ${log.food_id}`}</strong>
                  <span>{log.grams} г, {log.meal_type}</span>
                </li>
              ))}
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
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Граммы" fill="#1f8a70" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Нет данных" text="Диаграмма появится после первой записи питания." />
          )}
        </section>
      </div>

      <form className="panel form-grid compact" onSubmit={createFood}>
        <label>
          Название продукта
          <input value={foodName} onChange={(event) => setFoodName(event.target.value)} placeholder="Например: Рис отварной" minLength={2} required />
        </label>
        <NumberField label="Ккал на 100 г" min={0} max={1200} value={foodCalories} onChange={setFoodCalories} />
        <NumberField label="Белки" min={0} max={100} step={0.1} value={foodProtein} onChange={setFoodProtein} />
        <NumberField label="Жиры" min={0} max={100} step={0.1} value={foodFat} onChange={setFoodFat} />
        <NumberField label="Углеводы" min={0} max={100} step={0.1} value={foodCarbs} onChange={setFoodCarbs} />
        <button className="primary-button" type="submit" disabled={isSaving}><Plus size={18} />Добавить продукт</button>
      </form>

      <form className="panel inline-form two" onSubmit={saveGoal}>
        <NumberField label="Дневная цель, ккал" min={900} max={6000} value={goal} onChange={setGoal} />
        <button className="secondary-button" type="submit" disabled={isSaving}>Сохранить цель</button>
      </form>
    </section>
  )
}

function AiPage() {
  const { session } = useAuth()
  const userId = session?.userId ?? ''

  // Загружаем кеш при инициализации
  const cache = loadAiCache()

  // Инициализация с кешем
  const [sex, setSex] = useState(cache?.form.sex ?? 'male')
  const [weight, setWeight] = useState(cache?.form.weight ?? 78)
  const [level, setLevel] = useState(cache?.form.level ?? 'intermediate')
  const [goal, setGoal] = useState(cache?.form.goal ?? 'strength')
  const [limitations, setLimitations] = useState(cache?.form.limitations ?? '')
  const [equipment, setEquipment] = useState(cache?.form.equipment ?? 'штанга, гантели')
  const [calories, setCalories] = useState(cache?.form.calories ?? 2400)
  const [diet, setDiet] = useState(cache?.form.diet ?? 'balanced')
  const [preferences, setPreferences] = useState(cache?.form.preferences ?? 'больше белка')

  const [workoutNote, setWorkoutNote] = useState<Notice>(null)
  const [mealNote, setMealNote] = useState<Notice>(null)

  const [workoutResult, setWorkoutResult] = useState<AiWorkoutResponse | null>(cache?.workoutResult ?? null)
  const [mealResult, setMealResult] = useState<AiMealResponse | null>(cache?.mealResult ?? null)

  const [isWorkoutLoading, setWorkoutLoading] = useState(false)
  const [isMealLoading, setMealLoading] = useState(false)

  // Для dedup (защита от повторного добавления)
  const [addedExercises, setAddedExercises] = useState<Set<string>>(new Set())
  const [addedFoods, setAddedFoods] = useState<Set<string>>(new Set())
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set())
  const [isWorkoutAdded, setIsWorkoutAdded] = useState(false)
  const [isMealPlanAdded, setIsMealPlanAdded] = useState(false)

  // Для toast-уведомлений
  const [toast, setToast] = useState<string | null>(null)

  // Загрузка профиля
  useEffect(() => {
    profileApi.get(userId)
      .then((profile) => {
        if (!profile) return
        setSex(profile.sex)
        setWeight(profile.weight)
        setCalories(profile.daily_calories_goal)
      })
      .catch(() => undefined)
  }, [userId])

  // Автосохранение в localStorage
  useEffect(() => {
    saveAiCache({
      workoutResult,
      mealResult,
      form: {
        sex,
        weight,
        level,
        goal,
        limitations,
        equipment,
        calories,
        diet,
        preferences,
      },
    })
  }, [
    workoutResult,
    mealResult,
    sex,
    weight,
    level,
    goal,
    limitations,
    equipment,
    calories,
    diet,
    preferences,
  ])

  // toast-хелпер
  function showToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(null), 2000)
  }

  // key-хелперы для dedup
  function keyExercise(exercise: AiWorkoutResponse['exercises'][number]) {
    return `${exercise.name}_${exercise.sets}_${exercise.reps}_${exercise.weight_kg}`
  }

  function keyFood(food: AiMealResponse['meals'][number]['foods'][number]) {
    return `${food.name}_${food.grams}`
  }

  function keyMeal(meal: AiMealResponse['meals'][number]) {
    return meal.meal_type
  }

  // =========================
  // AI GENERATION
  // =========================

  async function generateWorkout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setWorkoutNote(null)

    setAddedExercises(new Set())
    setIsWorkoutAdded(false)

    if (!ensureForm(e.currentTarget, setWorkoutNote)) return

    setWorkoutLoading(true)
    try {
      const payload: AiWorkoutRequest = {
        user_id: userId,
        sex,
        weight,
        level,
        goal,
        limitations: splitCsv(limitations),
        equipment: splitCsv(equipment),
      }

      const response = await aiApi.workout(payload)
      setWorkoutResult(response)
      setWorkoutNote({ type: 'success', text: 'План тренировки получен.' })
    } catch (error) {
      setWorkoutNote({
        type: 'error',
        text: apiError(error, 'AI-сервис сейчас недоступен. Попробуйте позже.'),
      })
    } finally {
      setWorkoutLoading(false)
    }
  }

  async function generateMeal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMealNote(null)

    setAddedFoods(new Set())
    setAddedMeals(new Set())
    setIsMealPlanAdded(false)

    if (!ensureForm(e.currentTarget, setMealNote)) return

    setMealLoading(true)
    try {
      const payload: AiMealPlanRequest = {
        user_id: userId,
        calories,
        diet,
        preferences: splitCsv(preferences),
      }

      const response = await aiApi.mealPlan(payload)
      setMealResult(response)
      setMealNote({ type: 'success', text: 'План питания получен.' })
    } catch (error) {
      setMealNote({
        type: 'error',
        text: apiError(error, 'AI-сервис сейчас недоступен. Попробуйте позже.'),
      })
    } finally {
      setMealLoading(false)
    }
  }

  // =========================
  // SAVE ACTIONS (UX BUTTONS)
  // =========================

  async function addExerciseFromAi(
    exercise: AiWorkoutResponse['exercises'][number],
  ) {
    const key = keyExercise(exercise)
    if (addedExercises.has(key)) {
      showToast('⚠️ Упражнение уже добавлено')
      return
    }
    await saveSingleAiExercise(userId, exercise)
    setAddedExercises(prev => new Set(prev).add(key))
    showToast('✅ Упражнение добавлено')
  }

  async function addWholeWorkout() {
    if (!workoutResult) return
    
    // Проверяем, не добавлена ли уже вся тренировка
    if (isWorkoutAdded) {
      showToast('⚠️ Тренировка уже добавлена')
      return
    }
    
    await saveAiWorkout(userId, workoutResult)
    setIsWorkoutAdded(true)
    showToast('✅ Тренировка добавлена')
  }

  async function addFoodFromAi(
    food: AiMealResponse['meals'][number]['foods'][number],
    mealType: string,
  ) {
    const key = keyFood(food)
    if (addedFoods.has(key)) {
      showToast('⚠️ Продукт уже добавлен сегодня')
      return
    }
    await saveAiFood(userId, food, mealType)
    setAddedFoods(prev => new Set(prev).add(key))
    showToast('✅ Продукт добавлен')
  }

  async function addMealFromAi(
    meal: AiMealResponse['meals'][number],
  ) {
    const key = keyMeal(meal)
    if (addedMeals.has(key)) {
      showToast('⚠️ Приём пищи уже добавлен')
      return
    }
    for (const food of meal.foods) {
      await saveAiFood(userId, food, meal.meal_type)
    }
    setAddedMeals(prev => new Set(prev).add(key))
    showToast(`✅ ${meal.meal_type} добавлен`)
  }

  async function addWholeMealPlan() {
    if (!mealResult) return
    
    // Проверяем, не добавлен ли уже весь рацион
    if (isMealPlanAdded) {
      showToast('⚠️ Рацион уже добавлен')
      return
    }
    
    await saveAiMealPlan(userId, mealResult)
    setIsMealPlanAdded(true)
    showToast('✅ Рацион добавлен')
  } 

  // =========================
  // UI
  // =========================

  return (
    <section className="page">
      <PageHeader
        title="AI-план"
        subtitle="Сформируйте тренировку или рацион по вашим целям."
      />

      <div className="split-grid">

        {/* ================= WORKOUT ================= */}
        <form className="panel feature-panel" onSubmit={generateWorkout}>
          <Sparkles size={28} />
          <h2>План тренировки</h2>

          <div className="form-grid compact">
            <label>
              Пол
              <select value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </label>

            <NumberField label="Вес, кг" min={30} max={250} value={weight} onChange={setWeight} />

            <label>
              Уровень
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="beginner">Начальный</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </label>

            <label>
              Цель
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="strength">Сила</option>
                <option value="hypertrophy">Мышцы</option>
                <option value="fat_loss">Снижение веса</option>
                <option value="endurance">Выносливость</option>
              </select>
            </label>
          </div>

          <label>
            Ограничения
            <input value={limitations} onChange={(e) => setLimitations(e.target.value)} />
          </label>

          <label>
            Оборудование
            <input value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          </label>

          <button className="primary-button" type="submit" disabled={isWorkoutLoading}>
            {isWorkoutLoading ? <Loader2 className="spin" size={18} /> : null}
            Сгенерировать
          </button>

          <NoticeBox notice={workoutNote} />

          {/* RESULT */}
          {workoutResult && (
            <div className="panel ai-result">

              <h3>Тренировка • {workoutResult.duration_minutes} мин</h3>

              <div className="ai-exercises">
                {workoutResult.exercises.map((exercise, index) => (
                  <div key={index} className="item-card">
                    <strong>{exercise.name}</strong>
                    <span>{exercise.muscle_group}</span>

                    <p>
                      {exercise.sets} × {exercise.reps} • {exercise.weight_kg} кг
                    </p>

                    <small>{exercise.notes}</small>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => addExerciseFromAi(exercise)}
                    >
                      ＋ Добавить
                    </button>
                  </div>
                ))}
              </div>

              <div className="panel">
                <strong>Заминка</strong>
                <p>{workoutResult.cooldown}</p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={addWholeWorkout}
              >
                Добавить всю тренировку
              </button>
            </div>
          )}
        </form>

        {/* ================= MEAL ================= */}
        <form className="panel feature-panel" onSubmit={generateMeal}>
          <Sparkles size={28} />
          <h2>План питания</h2>

          <div className="form-grid compact">
            <NumberField label="Калории" min={900} max={6000} value={calories} onChange={setCalories} />

            <label>
              Тип рациона
              <select value={diet} onChange={(e) => setDiet(e.target.value)}>
                <option value="balanced">Сбалансированный</option>
                <option value="high_protein">Высокобелковый</option>
                <option value="low_carb">Меньше углеводов</option>
                <option value="vegetarian">Вегетарианский</option>
              </select>
            </label>
          </div>

          <label>
            Предпочтения
            <input value={preferences} onChange={(e) => setPreferences(e.target.value)} />
          </label>

          <button className="primary-button" type="submit" disabled={isMealLoading}>
            {isMealLoading ? <Loader2 className="spin" size={18} /> : null}
            Сгенерировать
          </button>

          <NoticeBox notice={mealNote} />

          {/* RESULT */}
          {mealResult && (
            <div className="panel ai-result">

              <div className="metric-grid">
                <div className="metric-card">
                  <span>Калории</span>
                  <strong>{mealResult.daily_calories}</strong>
                </div>

                <div className="metric-card">
                  <span>Белки</span>
                  <strong>{mealResult.protein_g} г</strong>
                </div>

                <div className="metric-card">
                  <span>Жиры</span>
                  <strong>{mealResult.fat_g} г</strong>
                </div>

                <div className="metric-card">
                  <span>Углеводы</span>
                  <strong>{mealResult.carbs_g} г</strong>
                </div>
              </div>

              {mealResult.meals.map((meal, index) => (
                <div key={index} className="panel">

                  <div className="toolbar">
                    <h3>{meal.meal_type}</h3>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => addMealFromAi(meal)}
                    >
                      ＋ Добавить приём пищи
                    </button>
                  </div>

                  <ul className="list">
                    {meal.foods.map((food, i) => (
                      <li key={i}>
                        <div>
                          <strong>{food.name}</strong>
                          <span>{food.grams} г</span>
                        </div>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => addFoodFromAi(food, meal.meal_type)}
                        >
                          ＋
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <button
                type="button"
                className="primary-button"
                onClick={addWholeMealPlan}
              >
                Добавить весь рацион
              </button>
            </div>
          )}
        </form>

      </div>

      {/* Toast уведомление */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
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
  const [isLoading, setIsLoading] = useState(false)

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (!ensureForm(event.currentTarget, setNotice)) return

    setIsLoading(true)
    try {
      const result = await calculatorApi.oneRm(weight, reps)
      setOneRm(result)
      setWorking(await calculatorApi.workingWeight(result.one_rm, percentage))
    } catch (error) {
      setNotice({ type: 'error', text: apiError(error, 'Не удалось рассчитать веса.') })
    } finally {
      setIsLoading(false)
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
        <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="spin" size={18} /> : null}Рассчитать</button>
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

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
  min?: number
  max?: number
  step?: number
}) {
  const error =
    value === ''
      ? 'Введите число.'
      : numberError(value, min, max)

  return (
    <label className={error ? 'invalid-field' : undefined}>
      {label}

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '' ? '' : Number(val))
        }}
        onBlur={() => {
          if (value === '') return
          onChange(clampNumber(value, min, max))
        }}
        aria-invalid={Boolean(error)}
        required
      />

      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

function ensureForm(form: HTMLFormElement, setNotice: (notice: Notice) => void) {
  if (form.reportValidity()) return true
  setNotice({ type: 'error', text: 'Проверьте выделенные поля: значение отсутствует или выходит за допустимые пределы.' })
  return false
}

function numberError(value: number, min?: number, max?: number) {
  if (min !== undefined && value < min) return `Минимум: ${min}.`
  if (max !== undefined && value > max) return `Максимум: ${max}.`
  return ''
}

function clampNumber(value: number, min?: number, max?: number) {
  if (!Number.isFinite(value)) return min ?? 0
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
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
    if (!session.completed_at) continue
    const date = new Date(session.completed_at)
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

function exerciseName(exercises: Exercise[], id: number) {
  return exercises.find((item) => item.id === id)?.name ?? `Упражнение ${id}`
}

function templateName(templates: WorkoutTemplate[], id: number) {
  return templates.find((item) => item.id === id)?.name ?? `Тренировка ${id}`
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function formatAiResponse(response: unknown) {
  if (response && typeof response === 'object' && 'raw' in response && typeof response.raw === 'string') return response.raw
  if (response && typeof response === 'object' && 'note' in response && typeof response.note === 'string') return response.note
  return JSON.stringify(response, null, 2)
}

function apiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(error.message) as { error?: string; note?: string }
    if (parsed.error?.includes('AI generation failed')) return 'AI-сервис вернул ошибку. Проверьте API_KEY на бэкенде или повторите позже.'
    return parsed.note ? `${parsed.note}: ${parsed.error ?? fallback}` : (parsed.error ?? fallback)
  } catch {
    return error.message || fallback
  }
}

export default App
