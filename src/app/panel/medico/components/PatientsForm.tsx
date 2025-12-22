'use client';

import { useState } from 'react';
import { useMedico } from '@/context/MedicoContext';
import { supabase } from '@/lib/supabaseClient';

export interface Paciente {
  id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  edad: number;
  sexo: 'Masculino' | 'Femenino';
  menopausia?: 'Sí' | 'No';
  estatura: number;
  peso: number;
  ocupacion: string;
  fuma: boolean;
  alcohol: boolean;
  actividadFisica: string;
  diabetes: boolean;
  hipotiroidismo: boolean;
  fracturas: boolean;
  lugarFractura?: string;
  familiaresOsteoporosis: boolean;
  quienesOsteoporosis?: string;
  familiaresOsteoartritis: boolean;
  quienesOsteoartritis?: string;
  medicamentos: boolean;
  cualesMedicamentos?: string;
  requiereEstudios: boolean;
  cualesEstudios?: string;
  radiografia?: string;
  diagnostico?: string;
  fechaCreacion?: string;

  // Nuevos campos clínicos
  motivoConsulta?: string;
  notasClinicas?: string;

  // Resultado óseo / IA
  tieneOsteoporosis?: boolean;
  tieneOsteoartritis?: boolean;
  resultadoIA?: string;

  // Datos del médico (para ligar expediente)
  medicoNombre?: string;
  medicoEspecialidad?: string;
  medicoCorreo?: string;
  medicocedulaProfesional? :string;
}

export interface Medico {
  id: string;
  nombre: string;
  cedulaProfesional: string;
  correo: string;
  telefono: string;
  especialidad?: string;
}

// Define la estructura de una visita en el expediente
interface Visita {
  fecha: string;
  medico: string;
  motivo: string;
  estudios: string;
  diagnostico: string;
  radiografias: string[];
  tratamiento: string;
  observaciones: string;
  imagenes: string[];
  medicoNombre: string;
  medicoEspecialidad: string;
  medicoCorreo: string;
  medicocedulaProfesional:string;
  notas: string;
}

interface Expediente {
  nombre: string;
  edad: string;
  sexo: string;
  antecedentes: string;
  diagnosticoInicial: string;
  tratamientoInicial: string;
  observacionesIniciales: string;
  radiografias: string[];
  visitas: Visita[];
  historial: Visita[];
}

// Guarda el expediente en localStorage (luego se puede migrar a Supabase)
const guardarExpediente = (expediente: Expediente) => {
  try {
    localStorage.setItem(
      `expediente_${expediente.nombre}`,
      JSON.stringify(expediente),
    );
    console.log('Expediente guardado:', expediente);
  } catch (error) {
    console.error('Error al guardar expediente:', error);
  }
};

interface PatientsFormProps {
  initialData?: Paciente | null;
  onSave: (data: Paciente) => void;
  onDelete?: (id: string) => void;
  medico?: Medico;
}

export default function PatientsForm({
  initialData,
  onSave,
  onDelete,
}: PatientsFormProps) {
  const { medico } = useMedico();
  const [aceptaConfidencialidad, setAceptaConfidencialidad] = useState(false);

  if (!medico) {
    return <p className="text-center mt-6 text-slate-500">Cargando datos del médico...</p>;
  }

  const generateId = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const initialPaciente: Paciente = {
    id: initialData?.id || '',
    nombre: initialData?.nombre || '',
    correo: initialData?.correo || '',
    telefono: initialData?.telefono || '',
    edad: initialData?.edad || 0,
    sexo: initialData?.sexo || 'Masculino',
    menopausia: initialData?.menopausia,
    estatura: initialData?.estatura || 0,
    peso: initialData?.peso || 0,
    ocupacion: initialData?.ocupacion || '',
    fuma: initialData?.fuma || false,
    alcohol: initialData?.alcohol || false,
    actividadFisica: initialData?.actividadFisica || '',
    diabetes: initialData?.diabetes || false,
    hipotiroidismo: initialData?.hipotiroidismo || false,
    fracturas: initialData?.fracturas || false,
    lugarFractura: initialData?.lugarFractura || '',
    familiaresOsteoporosis: initialData?.familiaresOsteoporosis || false,
    quienesOsteoporosis: initialData?.quienesOsteoporosis || '',
    familiaresOsteoartritis: initialData?.familiaresOsteoartritis || false,
    quienesOsteoartritis: initialData?.quienesOsteoartritis || '',
    medicamentos: initialData?.medicamentos || false,
    cualesMedicamentos: initialData?.cualesMedicamentos || '',
    requiereEstudios: initialData?.requiereEstudios || false,
    cualesEstudios: initialData?.cualesEstudios || '',
    radiografia: initialData?.radiografia || '',
    diagnostico: initialData?.diagnostico || '',
    motivoConsulta: initialData?.motivoConsulta || '',
    notasClinicas: initialData?.notasClinicas || '',
    tieneOsteoporosis: initialData?.tieneOsteoporosis || false,
    tieneOsteoartritis: initialData?.tieneOsteoartritis || false,
    resultadoIA:
      initialData?.resultadoIA ||
      'Pendiente de análisis automático (modelo IA).',
    medicoNombre: initialData?.medicoNombre || medico.nombre,
    medicoEspecialidad:
      initialData?.medicoEspecialidad || medico.especialidad || '',
    medicoCorreo: initialData?.medicoCorreo || medico.correo,
  };

  const [paciente, setPaciente] = useState<Paciente>(initialPaciente);
  /*const [zoomStyle, setZoomStyle] = useState({
    backgroundImage: '',
    backgroundPosition: '0% 0%',
    backgroundSize: '200%',
    visible: false,
  });*/
  const [analizando, setAnalizando] = useState(false);
  const [imagenProcesada, setImagenProcesada] = useState<string | null>(null);
  const [imagenEtiquetada, setImagenEtiquetada] = useState<string | null>(null);
  // ----------------------------------------------------
  // 🔧 NUEVOS ESTADOS DE ZOOM (independientes)
  // ----------------------------------------------------

  const [zoomOriginal, setZoomOriginal] = useState({
    position: "center",
    size: "200%",
    visible: false,
  });

  const [zoomProcesada, setZoomProcesada] = useState({
    position: "center",
    size: "200%",
    visible: false,
  });

  const [zoomEtiquetada, setZoomEtiquetada] = useState({
    position: "center",
    size: "200%",
    visible: false,
  });

  // ----------------------------------------------------
  // 🔧 NUEVOS HANDLERS DE ZOOM (UNO POR IMAGEN)
  // ----------------------------------------------------

  const handleMoveOriginal = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomOriginal({
      position: `${x}% ${y}%`,
      size: "200%",
      visible: true,
    });
  };

  const handleLeaveOriginal = () =>
    setZoomOriginal((z) => ({ ...z, visible: false }));

  // Imagen procesada
  const handleMoveProcesada = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomProcesada({
      position: `${x}% ${y}%`,
      size: "200%",
      visible: true,
    });
  };

  const handleLeaveProcesada = () =>
    setZoomProcesada((z) => ({ ...z, visible: false }));

  // Imagen etiquetada
  const handleMoveEtiquetada = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomEtiquetada({
      position: `${x}% ${y}%`,
      size: "200%",
      visible: true,
    });
  };

  const handleLeaveEtiquetada = () =>
    setZoomEtiquetada((z) => ({ ...z, visible: false }));
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setPaciente((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato incorrecto. Solo JPEG o PNG.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaciente((prev) => ({ ...prev, radiografia: reader.result as string }));
      /*setZoomStyle({
        backgroundImage: `url(${reader.result})`,
        backgroundPosition: '0% 0%',
        backgroundSize: '200%',
        visible: false,
      });*/
    };
    reader.readAsDataURL(file);
  };

  /*const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle((prev) => ({
      ...prev,
      backgroundPosition: `${x}% ${y}%`,
      visible: true,
    }));
  };

  const handleMouseLeave = () =>
    setZoomStyle((prev) => ({ ...prev, visible: false }));*/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aceptaConfidencialidad) {
      alert('Debes aceptar el aviso de privacidad');
      return;
    }

    const fechaHoy = new Date().toISOString();


    // 1. Guardar o actualizar paciente
    const { data: pacienteData, error: errorPaciente } = await supabase
      .from('pacientes')
      .upsert([
        {
          
          nombre: paciente.nombre,
          correo: paciente.correo,
          telefono: paciente.telefono,
          edad: paciente.edad,
          sexo: paciente.sexo,
          estatura: paciente.estatura,
          peso: paciente.peso,
          ocupacion: paciente.ocupacion,
          fecha_registro: fechaHoy,
          medico_id: medico.id,
          requiere_estudio: paciente.requiereEstudios,
        },
      ])
      .select()
      .single();

    if (errorPaciente) {
      console.error(errorPaciente);
      return alert("❌ Error guardando paciente");
    }
 
    /* // 2. Guardar/actualizar en medico_pacientes
     await supabase
       .from("medico_pacientes")
       .insert({
         medico_id: medico.id,
         paciente_id: pacienteData.id,
         nombre: pacienteData.nombre,
         sexo: pacienteData.sexo,
         fecha_registro: fechaHoy,
         requiere_estudio: paciente.requiereEstudios,
       });*/


    // 2. Guardar consulta inicial automáticamente
    // 2. Guardar consulta inicial automáticamente
    const { error: errorConsulta } = await supabase
      .from('consultas')
      .insert([
        {
          paciente_id: pacienteData.id,

          motivo: paciente.motivoConsulta,
          notas: paciente.notasClinicas,
          diagnostico: paciente.diagnostico,
          actividadFisica: paciente.actividadFisica,
          estudios: paciente.cualesEstudios,
          /*resultadoIA: paciente.resultadoIA,*/

          tieneOsteoporosis: paciente.tieneOsteoporosis,
          tieneOsteoartritis: paciente.tieneOsteoartritis,
          radiografia: paciente.radiografia,
          imagen_procesada: imagenProcesada,
          imagen_etiquetada: imagenEtiquetada,


          fuma: paciente.fuma,
          diabetes:paciente.diabetes,
          hipotiroidismo: paciente.hipotiroidismo,
          alcohol: paciente.alcohol,
          menopausia:paciente.menopausia,
          fracturas: paciente.fracturas,
          lugarFractura: paciente.lugarFractura,

          familiaresOsteoporosis: paciente.familiaresOsteoporosis,
          quienesOsteoporosis: paciente.quienesOsteoporosis,

          familiaresOsteoartritis: paciente.familiaresOsteoartritis,
          quienesOsteoartritis: paciente.quienesOsteoartritis,

          medicamentos: paciente.medicamentos,
          cualesMedicamentos: paciente.cualesMedicamentos,
          

          medico_id: medico.id,
          medico_nombre: medico.nombre,
          medico_correo: medico.correo,
          medico_especialidad:medico.especialidad,
          medico_telefono : medico.telefono,
          medico_cedula : medico.cedulaProfesional,
        },

      ]);

    if (errorConsulta) {
      console.error(errorConsulta);
      return alert("❌ Error guardando la consulta inicial");
    }

    alert("✔ Paciente registrado y consulta inicial guardada");
    onSave(pacienteData);
  };


  const handleDelete = () => onDelete?.(paciente.id);
  const handleReset = () => setPaciente(initialPaciente);
  const handleRemoveRadiografia = () => {
    setPaciente((prev) => ({ ...prev, radiografia: '' }));
    /*setZoomStyle({
      backgroundImage: '',
      backgroundPosition: '0% 0%',
      backgroundSize: '200%',
      visible: false,
    });*/
    // resetear zoom independiente
    setZoomOriginal({ position: "center", size: "200%", visible: false });
    setZoomProcesada({ position: "center", size: "200%", visible: false });
    setZoomEtiquetada({ position: "center", size: "200%", visible: false });
  };

  const handleAnalyze = async () => {
    if (!paciente.radiografia) return;

    setAnalizando(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: base64ToFormData(paciente.radiografia),
      });

      const data = await res.json();

      // 1️⃣ Guardar resultado IA en texto visible
      setPaciente(prev => ({
        ...prev,
        resultadoIA: `
Osteoporosis: ${data.resultado.clase_op}  (prob: ${data.resultado.prob_op})
Osteoartritis: ${data.resultado.clase_oa}  (prob: ${data.resultado.prob_oa})
      `,
        tieneOsteoporosis: data.resultado.clase_op !== "normal",
        tieneOsteoartritis: data.resultado.clase_oa !== "normal-dudoso"
      }));

      // 2️⃣ Guardar imágenes si existen
      setImagenProcesada(data.imagenProcesada ?? null);
      setImagenEtiquetada(data.imagenEtiquetada ?? null);

    } catch (err) {
      console.error(err);
      alert("Error analizando imagen");
    }

    setAnalizando(false);
  };

  const base64ToFormData = (base64: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) u8arr[n] = bstr.charCodeAt(n);

    const file = new File([u8arr], "radiografia.jpg", { type: mime });
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] rounded-3xl p-8 md:p-10 space-y-8 border border-slate-100"
    >
      <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
        Formulario de Paciente
      </h2>
      <p className="text-center text-sm text-slate-500 mb-4">
        Completa el expediente clínico inicial del paciente.
      </p>

      {/* DATOS DEL PACIENTE */}
      <details
        open
        className="border border-slate-200 rounded-2xl bg-slate-50/70 shadow-sm overflow-hidden"
      >
        <summary className="font-semibold cursor-pointer px-5 py-3 bg-slate-100/80 text-slate-800 text-sm md:text-base">
          Datos del paciente
        </summary>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                ID Paciente:
              </span>
              <input
                type="text"
                name="id"
                value={paciente.id}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-100 text-slate-700 text-sm focus:outline-none"
              />
              <span className="text-xs text-gray-500 mt-1">
                Este ID, el correo y el teléfono se usarán para ligar con el
                panel del paciente.
              </span>
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">Nombre:</span>
              <input
                type="text"
                name="nombre"
                value={paciente.nombre}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">Correo:</span>
              <input
                type="email"
                name="correo"
                value={paciente.correo}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Teléfono:
              </span>
              <input
                type="tel"
                name="telefono"
                value={paciente.telefono}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">Edad:</span>
              <input
                type="number"
                name="edad"
                value={paciente.edad}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">Sexo:</span>
              <select
                name="sexo"
                value={paciente.sexo}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Estatura (m):
              </span>
              <input
                type="number"
                name="estatura"
                step="0.01"
                value={paciente.estatura}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Peso (kg):
              </span>
              <input
                type="number"
                name="peso"
                step="0.1"
                value={paciente.peso}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Ocupación:
              </span>
              <input
                type="text"
                name="ocupacion"
                value={paciente.ocupacion}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>
          </div>
        </div>
      </details>

      {/* MOTIVO DE CONSULTA / HISTORIA CLÍNICA BREVE */}
      <details className="border border-slate-200 rounded-2xl bg-slate-50/70 shadow-sm overflow-hidden">
        <summary className="font-semibold cursor-pointer px-5 py-3 bg-slate-100/80 text-slate-800 text-sm md:text-base">
          Motivo de consulta e historia clínica
        </summary>
        <div className="px-6 py-5 space-y-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              Motivo de consulta:
            </span>
            <textarea
              name="motivoConsulta"
              value={paciente.motivoConsulta}
              onChange={handleChange}
              className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Ej. Dolor en rodilla derecha desde hace 3 meses..."
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              Notas clínicas iniciales:
            </span>
            <textarea
              name="notasClinicas"
              value={paciente.notasClinicas}
              onChange={handleChange}
              className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Observaciones relevantes, antecedentes específicos de esta consulta..."
            />
          </label>
        </div>
      </details>

      {/* ANTECEDENTES Y HÁBITOS */}
      <details className="border border-slate-200 rounded-2xl bg-slate-50/70 shadow-sm overflow-hidden">
        <summary className="font-semibold cursor-pointer px-5 py-3 bg-slate-100/80 text-slate-800 text-sm md:text-base">
          Antecedentes y hábitos
        </summary>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paciente.sexo === 'Femenino' && (
              <label className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">
                  ¿Está en menopausia?
                </span>
                <select
                  name="menopausia"
                  value={paciente.menopausia || ''}
                  onChange={handleChange}
                  className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Selecciona</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </label>
            )}

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="fuma"
                checked={paciente.fuma}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Fuma</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="alcohol"
                checked={paciente.alcohol}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Consume alcohol</span>
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Actividad física:
              </span>
              <textarea
                name="actividadFisica"
                value={paciente.actividadFisica}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="diabetes"
                checked={paciente.diabetes}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Diabetes</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="hipotiroidismo"
                checked={paciente.hipotiroidismo}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Hipotiroidismo</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="fracturas"
                checked={paciente.fracturas}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Fracturas previas</span>
            </label>

            {paciente.fracturas && (
              <label className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">
                  Lugar de fractura:
                </span>
                <input
                  type="text"
                  name="lugarFractura"
                  value={paciente.lugarFractura}
                  onChange={handleChange}
                  className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </label>
            )}

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="familiaresOsteoporosis"
                checked={paciente.familiaresOsteoporosis}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Familiares con osteoporosis</span>
            </label>

            {paciente.familiaresOsteoporosis && (
              <input
                type="text"
                name="quienesOsteoporosis"
                value={paciente.quienesOsteoporosis}
                onChange={handleChange}
                placeholder="Quiénes"
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="familiaresOsteoartritis"
                checked={paciente.familiaresOsteoartritis}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Familiares con osteoartritis</span>
            </label>

            {paciente.familiaresOsteoartritis && (
              <input
                type="text"
                name="quienesOsteoartritis"
                value={paciente.quienesOsteoartritis}
                onChange={handleChange}
                placeholder="Quiénes"
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}

            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="medicamentos"
                checked={paciente.medicamentos}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Toma medicamentos controlados</span>
            </label>

            {paciente.medicamentos && (
              <input
                type="text"
                name="cualesMedicamentos"
                value={paciente.cualesMedicamentos}
                onChange={handleChange}
                placeholder="Cuáles"
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}
          </div>
        </div>
      </details>

      {/* ESTUDIOS, DIAGNÓSTICO Y RESULTADO ÓSEO */}
      <details className="border border-slate-200 rounded-2xl bg-slate-50/70 shadow-sm overflow-hidden">
        <summary className="font-semibold cursor-pointer px-5 py-3 bg-slate-100/80 text-slate-800 text-sm md:text-base">
          Estudios, diagnóstico y resultado óseo
        </summary>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center space-x-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="requiereEstudios"
                checked={paciente.requiereEstudios}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <span>Requiere más estudios</span>
            </label>

            {paciente.requiereEstudios && (
              <input
                type="text"
                name="cualesEstudios"
                value={paciente.cualesEstudios}
                onChange={handleChange}
                placeholder="Cuáles"
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Impresión clínica / Resultado:
              </span>
              <textarea
                name="diagnostico"
                value={paciente.diagnostico}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white/90 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Descripción clínica de los hallazgos, sospecha de osteoporosis u osteoartritis…"
              />
            </label>

            {/* <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="tieneOsteoporosis"
                  checked={paciente.tieneOsteoporosis || false}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                <span>Presencia de osteoporosis (evaluación clínica)</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="tieneOsteoartritis"
                  checked={paciente.tieneOsteoartritis || false}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                <span>Presencia de osteoartritis (evaluación clínica)</span>
              </label>
            </div>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Resultado automático (modelo IA):
              </span>
              <textarea
                name="resultadoIA"
                value={paciente.resultadoIA}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-gray-600 text-xs md:text-sm min-h-[70px] focus:outline-none"
              />
              <span className="text-xs text-gray-500 mt-1">
                Este campo será llenado automáticamente más adelante por el
                algoritmo en Python que analice la radiografía.
              </span>
            </label> */}
            <input type="hidden" name="resultadoIA" value={paciente.resultadoIA} />


            {/* Radiografía */}
            <div className="flex flex-col space-y-2 md:col-span-2">
              <span className="font-semibold text-sm text-slate-700">
                Radiografía:
              </span>
              <div className="flex items-center space-x-2">
                <label className="bg-cyan-600 text-white px-4 py-2 rounded-xl cursor-pointer text-sm font-medium shadow hover:bg-cyan-700 transition">
                  Subir radiografía
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
                {paciente.radiografia && (
                  <button
                    type="button"
                    onClick={handleRemoveRadiografia}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow hover:bg-red-700 transition"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Formatos permitidos: JPEG o PNG.
              </p>

              {paciente.radiografia && (
                <>
                  {/* 🔧 MODIFICADO: ZOOM INDEPENDIENTE */}
                  <div
                    onMouseMove={handleMoveOriginal}
                    onMouseLeave={handleLeaveOriginal}
                    className="w-64 h-64 mt-3 border rounded-xl shadow-inner bg-center bg-no-repeat bg-contain"
                    style={{
                      backgroundImage: `url(${paciente.radiografia})`,
                      backgroundPosition: zoomOriginal.visible
                        ? zoomOriginal.position
                        : 'center',
                      backgroundSize: zoomOriginal.visible
                        ? zoomOriginal.size
                        : 'contain',
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analizando}
                    className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:bg-indigo-700 transition"
                  >
                    {analizando ? "Analizando..." : "Analizar radiografía"}
                  </button>
                </>
              )}

{/* 🔧 IMÁGENES LADO A LADO */}
{(imagenProcesada || imagenEtiquetada) && (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

    {imagenProcesada && (
      <div>
        <p className="font-semibold text-sm mb-2">Imagen procesada:</p>
        <div
          onMouseMove={handleMoveProcesada}
          onMouseLeave={handleLeaveProcesada}
          className="w-full h-64 border rounded-xl shadow-inner bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url(${imagenProcesada})`,
            backgroundPosition: zoomProcesada.visible
              ? zoomProcesada.position
              : "center",
            backgroundSize: zoomProcesada.visible
              ? zoomProcesada.size
              : "contain",
          }}
        />
      </div>
    )}

    {imagenEtiquetada && (
      <div>
        <p className="font-semibold text-sm mb-2">Imagen etiquetada:</p>
        <div
          onMouseMove={handleMoveEtiquetada}
          onMouseLeave={handleLeaveEtiquetada}
          className="w-full h-64 border rounded-xl shadow-inner bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url(${imagenEtiquetada})`,
            backgroundPosition: zoomEtiquetada.visible
              ? zoomEtiquetada.position
              : "center",
            backgroundSize: zoomEtiquetada.visible
              ? zoomEtiquetada.size
              : "contain",
          }}
        />
      </div>
    )}

  </div>
)}
{/*<div className="mt-4 flex flex-col space-y-2 text-sm">

  <div className="flex items-center space-x-2">
    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#00FF00" }}></span>
    <span>Osteoporosis detectada</span>
  </div>

  <div className="flex items-center space-x-2">
    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#0000FF" }}></span>
    <span>Osteoartritis detectada</span>
  </div>

  <div className="flex items-center space-x-2">
    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#FFA500" }}></span>
    <span>Normal / sin hallazgos</span>
  </div>

</div>*/}
            </div>
            </div>
          </div>
      </details>

      {/* DATOS DEL MÉDICO */}
      <details
        open
        className="border border-slate-200 rounded-2xl bg-slate-50/70 shadow-sm overflow-hidden"
      >
        <summary className="font-semibold cursor-pointer px-5 py-3 bg-slate-100/80 text-slate-800 text-sm md:text-base">
          Datos del médico
        </summary>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Nombre:
              </span>
              <input
                type="text"
                value={medico.nombre}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-700 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Cédula profesional:
              </span>
              <input
                type="text"
                value={medico.cedulaProfesional}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-700 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Correo:
              </span>
              <input
                type="text"
                value={medico.correo}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-700 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Teléfono:
              </span>
              <input
                type="text"
                value={medico.telefono}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-700 focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                Especialidad:
              </span>
              <input
                type="text"
                value={medico.especialidad || ''}
                readOnly
                className="mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-700 focus:outline-none"
              />
            </label>
          </div>
        </div>
      </details>

      {/* BOTONES */}
      <div className="flex flex-wrap gap-3 justify-between pt-2">
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:bg-red-700 transition"
          >
            Borrar
          </button>
        )}

        <div className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="bg-slate-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:bg-slate-600 transition"
          >
            Borrar todo
          </button>

          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* AVISO DE PRIVACIDAD */}
      <div className="border border-yellow-300 rounded-2xl bg-yellow-50/90 text-yellow-900 mt-4 space-y-2 px-4 py-3 text-sm">
        <p>
          Todos los datos ingresados, incluyendo información clínica y
          radiografías, son confidenciales y se utilizarán únicamente con fines
          médicos y de investigación dentro de esta plataforma. No serán
          compartidos con terceros sin tu consentimiento.
        </p>
        <label className="flex items-center space-x-2 mt-1">
          <input
            type="checkbox"
            checked={aceptaConfidencialidad}
            onChange={(e) => setAceptaConfidencialidad(e.target.checked)}
            required
            className="rounded border-slate-300"
          />
          <span>Acepto el aviso de privacidad</span>
        </label>
      </div>
    </form>
  );
}
