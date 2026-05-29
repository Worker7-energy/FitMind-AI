package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

const (
	defaultBaseURL  = "https://openrouter.ai/api/v1"
	defaultModel    = "deepseek/deepseek-chat"
	defaultReferer  = "http://localhost:8081"
	defaultTitle    = "Fitness App"
	requestTimeout  = 120 * time.Second
)

type Client struct {
	apiKey  string
	baseURL string
	model   string
	referer string
	title   string
	http    *http.Client
}

func NewClient(apiKey, baseURL, model string) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	if model == "" {
		model = defaultModel
	}
	return &Client{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   model,
		referer: defaultReferer,
		title:   defaultTitle,
		http:    &http.Client{Timeout: requestTimeout},
	}
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
}

type chatChoice struct {
	Index   int         `json:"index"`
	Message chatMessage `json:"message"`
}

type chatResponse struct {
	Choices []chatChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (c *Client) chatCompletion(system, user string) (string, error) {
	body := chatRequest{
		Model: c.model,
		Messages: []chatMessage{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
		Temperature: 0.3,
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	req.Header.Set("HTTP-Referer", c.referer)
	req.Header.Set("X-Title", c.title)

	log.Printf("AI request: POST %s (key=%s..., model=%s)", c.baseURL+"/chat/completions", safePrefix(c.apiKey, 12), c.model)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("http call: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("OpenRouter error response: status=%d body=%s", resp.StatusCode, string(raw))
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(raw))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(raw, &chatResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w (body: %s)", err, string(raw))
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("api error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("empty response from API")
	}

	return stripMarkdownFences(chatResp.Choices[0].Message.Content), nil
}

func stripMarkdownFences(s string) string {
	s = strings.TrimSpace(s)
	// Remove ```json ... ``` or ``` ... ``` fences
	if strings.HasPrefix(s, "```") {
		idx := strings.Index(s, "\n")
		if idx != -1 {
			s = s[idx+1:]
		}
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	}
	return s
}

func safePrefix(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

func (c *Client) GenerateWorkout(sex string, weight float64, level, goal string, limitations, equipment []string) (string, error) {
	system := `Ты — профессиональный фитнес-тренер и экспертный AI для составления тренировок.
Отвечай ТОЛЬКО в формате JSON, без markdown-обёртки, без пояснений.

Формат ответа:
{
  "name": "Название тренировки",
  "goal": "цель",
  "exercises": [
    {
      "name": "Название упражнения",
      "muscle_group": "группа мышц",
      "sets": 3,
      "reps": 10,
      "weight_kg": 20,
      "notes": "заметка по технике"
    }
  ],
  "warmup": "разминка",
  "cooldown": "заминка",
  "duration_minutes": 45,
  "notes": "дополнительные рекомендации"
}`

	user := fmt.Sprintf(`Параметры:
- Пол: %s
- Вес: %.0f кг
- Уровень подготовки: %s
- Цель: %s
- Ограничения: %v
- Инвентарь: %v

Составь тренировку (4-6 упражнений) с учётом параметров.`, sex, weight, level, goal, limitations, equipment)

	return c.chatCompletion(system, user)
}

func (c *Client) GenerateMealPlan(calories int, preferences []string, diet string) (string, error) {
	system := `Ты — профессиональный диетолог и экспертный AI для составления рационов.
Отвечай ТОЛЬКО в формате JSON, без markdown-обёртки, без пояснений.

Формат ответа:
{
  "daily_calories": 2000,
  "protein_g": 150,
  "fat_g": 60,
  "carbs_g": 200,
  "meals": [
    {
      "meal_type": "завтрак",
      "foods": [
        {"name": "продукт", "grams": 100, "calories": 150, "protein": 10, "fat": 5, "carbs": 20}
      ],
      "total_calories": 500
    }
  ],
  "notes": "рекомендации по питанию"
}`

	user := fmt.Sprintf(`Параметры:
- Дневная норма калорий: %d
- Предпочтения: %v
- Тип диеты: %s

Составь рацион на день (3-5 приёмов пищи) с учётом параметров.`, calories, preferences, diet)

	return c.chatCompletion(system, user)
}
