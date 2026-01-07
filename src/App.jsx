import React, { useState, useEffect } from "react";
import { Trash2, Play, Upload } from "lucide-react";

export default function GTIA() {
  const [alumnos, setAlumnos] = useState([]);
  const [textareaValue, setTextareaValue] = useState("");
  const [girando, setGirando] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [rotacion, setRotacion] = useState(0);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [historialGanadores, setHistorialGanadores] = useState([]);
  const [contadorSorteos, setContadorSorteos] = useState(0);
  const [audioContext, setAudioContext] = useState(null);

  // Inicializar audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, []);

  const reproducirTik = () => {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = 900;
    osc.type = "square";

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  };

  const reproducirSonidoGanador = () => {
    if (!audioContext) return;
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioContext.destination);

    osc1.frequency.value = 523.25;
    osc2.frequency.value = 659.25;

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  };

  const cargarAlumnos = () => {
    const lineas = textareaValue
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length > 0) {
      setAlumnos(lineas);
      setAlumnoSeleccionado(null);
      setColorSeleccionado(null);
      setMostrarConfirmacion(false);
      setHistorialGanadores([]);
      setContadorSorteos(0);
      setRotacion(0);
    }
  };

  const limpiarLista = () => {
    setAlumnos([]);
    setTextareaValue("");
    setAlumnoSeleccionado(null);
    setColorSeleccionado(null);
    setMostrarConfirmacion(false);
    setHistorialGanadores([]);
    setContadorSorteos(0);
    setRotacion(0);
  };

  // 🎨 Colores únicos, alternando FRÍO / CALIENTE
  // Fríos: tonos entre 200° y 260°   (azules/morados)
  // Calientes: tonos entre   0° y  60° (rojos/naranjas)
  const generarColor = (index) => {
    const hueStep = 25; // separación entre colores para que no se parezcan mucho

    if (index % 2 === 0) {
      // FRÍO
      const frioIndex = index / 2;
      const baseHueFrio = 200;
      const hue = (baseHueFrio + frioIndex * hueStep) % 360;
      return `hsl(${hue}, 80%, 55%)`;
    } else {
      // CALIENTE
      const calienteIndex = (index - 1) / 2;
      const baseHueCaliente = 0;
      const hue = (baseHueCaliente + calienteIndex * hueStep) % 360;
      return `hsl(${hue}, 80%, 55%)`;
    }
  };

  const girarRuleta = () => {
    if (alumnos.length === 0 || girando) return;

    setGirando(true);
    setAlumnoSeleccionado(null);
    setMostrarConfirmacion(false);

    const total = alumnos.length;
    const anguloBase = 360 / total;
    const indiceGanador = Math.floor(Math.random() * total);

    const duracion = contadorSorteos % 2 === 0 ? 6000 : 8000;
    setContadorSorteos((c) => c + 1);

    // Flecha a la DERECHA → el radio hacia la flecha es ángulo 0°
    const anguloFlecha = 0;

    // Normalizar rotación actual para evitar acumulación rara
    const rotBase = ((rotacion % 360) + 360) % 360;

    // Ángulo del centro del sector ganador en el sistema original
    const angCentro = indiceGanador * anguloBase + anguloBase / 2;

    // Queremos que al final valga: angCentro + rotFinal ≡ anguloFlecha (mod 360)
    // Como rotFinal = rotBase + Δ, resolvemos Δ ≡ anguloFlecha - (angCentro + rotBase)
    const delta =
      (anguloFlecha - (angCentro + rotBase) + 360) % 360;

    // Le sumamos algunas vueltas completas para que sea vistoso
    const rotFinal = rotBase + 360 * 10 + delta;

    const inicio = performance.now();
    let ultimoSectorTik = null;

    const animar = (t) => {
      const tiempo = t - inicio;
      const prog = Math.min(tiempo / duracion, 1);
      const easeOut = 1 - Math.pow(1 - prog, 3);

      const angActual = rotBase + (rotFinal - rotBase) * easeOut;
      setRotacion(angActual);

      // --- TIK: cada vez que un límite de sector cruza la flecha (ángulo 0°) ---
      const rotNorm = ((angActual % 360) + 360) % 360;
      const angRel = (anguloFlecha - rotNorm + 360) % 360;
      const sector = Math.floor(angRel / anguloBase);

      if (sector !== ultimoSectorTik) {
        reproducirTik();
        ultimoSectorTik = sector;
      }
      // ------------------------------------------------------------------------ //

      if (prog < 1) {
        requestAnimationFrame(animar);
      } else {
        // Ajuste final exacto
        setRotacion(rotFinal);

        const color = generarColor(indiceGanador);
        const ganador = alumnos[indiceGanador];

        setAlumnoSeleccionado(ganador);
        setColorSeleccionado(color);
        setHistorialGanadores((prev) => [
          ...prev,
          { nombre: ganador, color },
        ]);

        setGirando(false);
        setMostrarConfirmacion(true);
        reproducirSonidoGanador();
      }
    };

    requestAnimationFrame(animar);
  };

  const eliminarSeleccionado = () => {
    if (!alumnoSeleccionado) return;
    const nuevos = alumnos.filter((a) => a !== alumnoSeleccionado);
    setAlumnos(nuevos);
    setTextareaValue(nuevos.join("\n"));
    setAlumnoSeleccionado(null);
    setColorSeleccionado(null);
    setMostrarConfirmacion(false);
  };

  const mantenerSeleccionado = () =>
    setMostrarConfirmacion(false);

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 flex flex-col items-center gap-2">
         <img
            src="/GTI-A.png"
            alt="GTI-A"
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
         />
        <span>GTI-A: Gestor de Turnos de Intervención Aleatoria</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* PANEL LISTA */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-2xl font-bold mb-3">
            📋 Lista de participantes ({alumnos.length})
          </h2>

          <textarea
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            className="w-full border-2 rounded-lg p-2 h-40 text-sm font-mono"
            placeholder={"Ingresa un alumno por línea"}
          />

          <div className="flex gap-3 mt-3">
            <button
              onClick={cargarAlumnos}
              disabled={textareaValue.trim().length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Cargar
            </button>

            <button
              onClick={limpiarLista}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>

          {alumnos.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 max-h-56 overflow-y-auto">
              {alumnos.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: generarColor(i) }}
                  />
                  <span>
                    {i + 1}. {a}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL RULETA */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-2xl font-bold text-center mb-4">
            ⚙️ Gestor de turnos 🔀
          </h2>

          {alumnos.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-gray-400 text-center">
              <p>Ingresa la lista de participantes y presiona “Cargar”.</p>
            </div>
          ) : (
            <>
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <svg
                  viewBox="0 0 450 400"
                  className="w-full h-full"
                >
                  {/* Ruleta */}
                  <g
                    transform={`translate(200,200) rotate(${rotacion})`}
                  >
                    {alumnos.map((al, idx) => {
                      const base = 360 / alumnos.length;
                      const start = idx * base;
                      const end = start + base;
                      const r = 180;

                      const rad = (deg) => (deg * Math.PI) / 180;
                      const x1 = r * Math.cos(rad(start));
                      const y1 = r * Math.sin(rad(start));
                      const x2 = r * Math.cos(rad(end));
                      const y2 = r * Math.sin(rad(end));

                      const mid = start + base / 2;

                      return (
                        <g key={idx}>
                          <path
                            d={`M0 0 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                            fill={generarColor(idx)}
                          />
                          <text
                            fill="#fff"
                            fontSize={alumnos.length > 20 ? 10 : 12}
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            transform={`rotate(${mid}) translate(${r * 0.65},0)`}
                          >
                            {al.length > 16
                              ? al.slice(0, 14) + "…"
                              : al}
                          </text>
                        </g>
                      );
                    })}

                    {/* Centro */}
                    <circle
                      cx="0"
                      cy="0"
                      r="38"
                      fill="#111827"
                      stroke="#fff"
                      strokeWidth="3"
                    />
                    <text
                      x="0"
                      y="6"
                      fill="#fff"
                      fontSize="20"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {alumnos.length}
                    </text>
                  </g>

                  {/* FLECHA DERECHA SIMPLE (apuntando al centro, sin adornos) */}
                  <g transform="translate(420,200)">
                    <path
                      d="M 0 -30 L -60 0 L 0 30 Z"
                      fill="#FF3838"
                      stroke="#fff"
                      strokeWidth="3"
                    />
                  </g>
                </svg>
              </div>

              <button
                onClick={girarRuleta}
                disabled={girando}
                className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <Play className="w-5 h-5" />
                {girando ? "Girando..." : "Girar ruleta"}
              </button>

              {alumnoSeleccionado && (
                <div
                  className="mt-5 p-5 rounded-xl text-center border-4 border-white shadow-xl"
                  style={{ backgroundColor: colorSeleccionado }}
                >
                    <p className="text-white text-2xl font-bold">
                      👤 ¡Turno asignado! ➡️
                    </p>
                    <p className="text-white text-3xl font-extrabold mt-2 break-words">
                      {alumnoSeleccionado}
                    </p>
                </div>
              )}

              {mostrarConfirmacion && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={eliminarSeleccionado}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm"
                  >
                    Eliminar de la lista
                  </button>
                  <button
                    onClick={mantenerSeleccionado}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm"
                  >
                    Mantener en lista
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* HISTORIAL */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-2xl font-bold mb-4">🗣️ Turnos de intervención</h2>

          {historialGanadores.length === 0 ? (
            <p className="text-gray-400 mt-10">
              Aún no hay turnos de intervención.
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {historialGanadores.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-50"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white"
                    style={{ backgroundColor: g.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">
                      {g.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      Turno de intervención #{i + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {historialGanadores.length > 0 && (
            <p className="mt-4 text-center text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg py-2">
              Total de intervenciones: {historialGanadores.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
