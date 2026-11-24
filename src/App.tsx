import { useEffect, useState } from "react";
import "./App.css";

type ResultType = "normal" | "high" | "low" | null;

type JournalEntry = {
  date: string;
  time: string;
  glucose: number;
  xe: number;
  insulin: number;
  bmi: number | null;
  result: number;
  resultType: ResultType;
};

function App() {
  const [glucose, setGlucose] = useState("");
  const [xe, setXe] = useState("");
  const [insulin, setInsulin] = useState("");

  const [useBmi, setUseBmi] = useState(false);
  const [bmi, setBmi] = useState("");

  const [result, setResult] = useState<number | null>(null);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [error, setError] = useState("");

  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [journalLoaded, setJournalLoaded] = useState(false);

  useEffect(() => {
  const savedJournal = localStorage.getItem("glukodvoinik-journal");

  if (savedJournal) {
    setJournal(JSON.parse(savedJournal));
  }

  setJournalLoaded(true);
}, []);

  useEffect(() => {
  if (!journalLoaded) {
    return;
  }

  localStorage.setItem(
    "glukodvoinik-journal",
    JSON.stringify(journal)
  );
}, [journal, journalLoaded]);

  const [dark, setDark] = useState(true);
  const [page, setPage] = useState<"calculator" | "journal">("calculator");
  const deleteEntry = (index: number) => {
  setJournal((current) =>
    current.filter((_, entryIndex) => entryIndex !== index)
  );
};

const clearJournal = () => {
  setJournal([]);
};

  const calculate = () => {
  setError("");

  const g = Number(glucose.replace(",", "."));
  const x = Number(xe.replace(",", "."));
  const i = Number(insulin.replace(",", "."));
  const b = Number(bmi.replace(",", "."));

  if (!glucose || !xe || !insulin) {
    setError("Заполните все обязательные поля.");
    return;
  }

  if (!Number.isFinite(g) || !Number.isFinite(x) || !Number.isFinite(i)) {
    setError("Введите корректные числовые значения.");
    return;
  }

  if (g <= 0) {
    setError("Текущая глюкоза должна быть больше 0.");
    return;
  }

  if (x < 0) {
    setError("Количество ХЕ не может быть отрицательным.");
    return;
  }

  if (i < 0) {
    setError("Доза инсулина не может быть отрицательной.");
    return;
  }

  if (useBmi) {
    if (!bmi) {
      setError("Введите ИМТ или отключите его учёт.");
      return;
    }

    if (!Number.isFinite(b) || b <= 0) {
      setError("Введите корректное значение ИМТ.");
      return;
    }
  }

  let forecast: number;

  if (useBmi) {
    const resistanceCoefficient = 1 + (b - 25) * 0.03;

    forecast =
      g + x * 2 - (i * 2.5) / resistanceCoefficient;
  } else {
    forecast = g + x * 2 - i * 2.5;
  }

  const rounded = Math.round(forecast * 10) / 10;

  const now = new Date();

  const newEntry: JournalEntry = {
    date: now.toLocaleDateString("ru-RU"),
    time: now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    glucose: g,
    xe: x,
    insulin: i,
    bmi: useBmi ? b : null,
    result: rounded,
    resultType:
      rounded < 3.9
        ? "low"
        : rounded >= 10
          ? "high"
          : "normal",
  };

  setJournal((current) => [newEntry, ...current]);
  setResult(rounded);

  if (rounded < 3.9) {
    setResultType("low");
  } else if (rounded >= 10) {
    setResultType("high");
  } else {
    setResultType("normal");
  }
};
const getStatus = () => {
  if (resultType === "low") {
    return {
      title: "Низкое значение",
      message: "Сахар ниже заданного диапазона.",
    };
  }

  if (resultType === "high") {
    return {
      title: "Высокое значение",
      message: "Сахар выше заданного диапазона.",
    };
  }

  return {
    title: "Норма",
    message: "С сахаром всё в порядке.",
  };
};
  const status = getStatus();

  return (
    <div className={`app ${dark ? "dark" : "light"}`}>
      <header className="topbar">
        <div className="brand">
          <div>
            <div className="brand-name">ГлюкоДвойник</div>
            <div className="brand-description">
              Учебный симулятор прогнозирования гликемии
            </div>
          </div>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setDark((value) => !value)}
          type="button"
          aria-label="Переключить тему"
        >
          {dark ? "☀" : "☾"}
        </button>
      </header>

      <nav className="navigation">
        <button
          className={page === "calculator" ? "active" : ""}
          onClick={() => setPage("calculator")}
          type="button"
        >
          Калькулятор
        </button>

        <button
          className={page === "journal" ? "active" : ""}
          onClick={() => setPage("journal")}
          type="button"
        >
          Журнал
        </button>
      </nav>

      <main className="main">
        {page === "calculator" ? (
          <>
            <section className="hero">
              <h1>
                Прогноз
                <br />
                <em>гликемии</em>
              </h1>

              <p>
                Введите параметры пациента и получите модельный
                прогноз уровня глюкозы через 2 часа.
              </p>
            </section>

            <section className="card calculator">
              <div className="card-title">
                <h2>Исходные данные</h2>
              </div>

              <div className="fields">
                <div className="field">
                  <label htmlFor="glucose">Текущая глюкоза</label>

                  <div className="input-box">
                    <input
                      id="glucose"
                      type="text"
                      inputMode="decimal"
                      placeholder="7.2"
                      value={glucose}
                      onChange={(event) =>
                        setGlucose(event.target.value)
                      }
                    />
                    <span>ммоль/л</span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="xe">Углеводные единицы</label>

                  <div className="input-box">
                    <input
                      id="xe"
                      type="text"
                      inputMode="decimal"
                      placeholder="4"
                      value={xe}
                      onChange={(event) =>
                        setXe(event.target.value)
                      }
                    />
                    <span>ХЕ</span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="insulin">Доза инсулина</label>

                  <div className="input-box">
                    <input
                      id="insulin"
                      type="text"
                      inputMode="decimal"
                      placeholder="4"
                      value={insulin}
                      onChange={(event) =>
                        setInsulin(event.target.value)
                      }
                    />
                    <span>ЕД</span>
                  </div>
                </div>
              </div>

              <div className="bmi-option">
                <div className="bmi-info">
                  <div className="bmi-title">
                    Учитывать ИМТ в расчёте?
                  </div>

                  <div className="bmi-description">
                    Дополнительный исследовательский фактор,
                    влияющий на коэффициент чувствительности к инсулину.
                  </div>
                </div>

                <button
                  className={`switch ${useBmi ? "active" : ""}`}
                  type="button"
                  onClick={() => setUseBmi((value) => !value)}
                  aria-label="Учитывать ИМТ"
                  aria-pressed={useBmi}
                >
                  <span />
                </button>
              </div>

              {useBmi && (
                <div className="bmi-field">
                  <label htmlFor="bmi">Индекс массы тела</label>

                  <div className="input-box">
                    <input
                      id="bmi"
                      type="text"
                      inputMode="decimal"
                      placeholder="23"
                      value={bmi}
                      onChange={(event) =>
                        setBmi(event.target.value)
                      }
                    />
                    <span>кг/м²</span>
                  </div>
                </div>
              )}

              <button
                className="calculate"
                onClick={calculate}
                type="button"
              >
                <span>Рассчитать прогноз</span>
                <span className="calculate-arrow">→</span>
              </button>
              {error && (
  <div className="error-message">
    {error}
  </div>
)}
            </section>

            {result !== null && (
              <section className={`result ${resultType}`}>
                <div className="result-header">
                  <h2>Прогноз через 2 часа</h2>

                  <div className="status-badge">
                    <span />
                    {status.title}
                  </div>
                </div>

                <div className="result-number">
                  {result}
                  <small>ммоль/л</small>
                </div>

                <div className="explanation">
                  <strong>{status.message}</strong>

                  <p>
                    {resultType === "low"
                      ? "Расчётное значение ниже 3,9 ммоль/л."
                      : resultType === "high"
                        ? "Расчётное значение находится на уровне 10 ммоль/л или выше."
                        : "Расчётное значение находится в диапазоне 3,9–10 ммоль/л."}
                  </p>
                </div>
              </section>
            )}

            <section className="notice">
              <div className="notice-icon">i</div>

              <div>
                <strong>Учебный исследовательский прототип</strong>

                <p>
                  Расчёт предназначен для моделирования и обучения.
                  Он не является медицинским назначением и не предназначен
                  для самостоятельного подбора дозы инсулина.
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="journal">
  <div className="journal-header">
    <h1>Журнал измерений</h1>
    <p>История расчётов сохраняется на этом устройстве.</p>
  </div>
  <button
  className="clear-journal"
  onClick={clearJournal}
  type="button"
>
  Очистить историю
</button>

  {journal.length === 0 ? (
    <div className="journal-empty">
      Здесь пока нет измерений.
      <br />
      Выполните расчёт в калькуляторе.
    </div>
  ) : (
    journal.map((entry, index) => (
      <div className="journal-entry" key={index}>
       <div className="journal-entry-top">
  <div>
    <span className="journal-date">{entry.date}</span>
    <span className="journal-time">{entry.time}</span>
  </div>

  <button
    className="delete-entry"
    onClick={() => deleteEntry(index)}
    type="button"
    aria-label="Удалить запись"
  >
    ✕
  </button>
</div>

        <div className="journal-data">
          <div className="journal-data-item">
            <div className="journal-data-label">Глюкоза</div>
            <div className="journal-data-value">
              {entry.glucose} ммоль/л
            </div>
          </div>

          <div className="journal-data-item">
            <div className="journal-data-label">ХЕ</div>
            <div className="journal-data-value">
              {entry.xe}
            </div>
          </div>

          <div className="journal-data-item">
            <div className="journal-data-label">Инсулин</div>
            <div className="journal-data-value">
              {entry.insulin} ЕД
            </div>
          </div>

          <div className="journal-data-item">
            <div className="journal-data-label">ИМТ</div>
            <div className="journal-data-value">
              {entry.bmi ?? "—"}
            </div>
          </div>
        </div>

        <div className={`journal-result ${entry.resultType}`}>
          <span className="journal-result-label">
            Прогноз через 2 часа
          </span>

          <span className="journal-result-value">
            {entry.result} ммоль/л
          </span>
        </div>
      </div>
    ))
  )}
</section>
        )}
      </main>

      <footer>
        ГлюкоДвойник <span>·</span> исследовательский прототип
      </footer>
    </div>
  );
}

export default App;