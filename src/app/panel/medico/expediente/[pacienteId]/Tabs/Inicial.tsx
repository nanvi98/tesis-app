'use client';

import {
  ClipboardList,
  Activity,
  AlertTriangle,
  Stethoscope,
  UserCircle2,
  ImageIcon,
} from 'lucide-react';

interface InicialProps {
  paciente: any;
  consulta: any; // primera consulta
}

export default function Inicial({ paciente, consulta }: InicialProps) {
  if (!paciente) return null;

  const edadTexto =
    paciente.edad !== undefined && paciente.edad !== null
      ? `${paciente.edad} años`
      : '';

        // 🔄 Normalizar nombres de campos (a veces vienen en minúsculas)
  const imagenProcesada =
    consulta?.imagenProcesada ??
    consulta?.imagenprocesada ??
    consulta?.imagen_procesada ??
    null;

  const imagenEtiquetada =
    consulta?.imagenEtiquetada ??
    consulta?.imagenetiquetada ??
    consulta?.imagen_etiquetada ??
    null;

  return (
    <div className="space-y-6">
      {/* ───────────── DATOS DEL PACIENTE ───────────── */}
      <Section
        title="Datos del paciente"
        icon={<UserCircle2 className="w-6 h-4" />}
      >
        <Grid>
          <Item label="ID paciente" value={paciente.id} />
          <Item label="Nombre" value={paciente.nombre} />
          <Item label="Correo" value={paciente.correo} />
          <Item label="Teléfono" value={paciente.telefono} />
          <Item label="Edad" value={edadTexto} />
          <Item label="Sexo" value={paciente.sexo} />
          <Item label="Estatura" value={consulta?.estatura ?? paciente.estatura} />
          <Item label="Peso" value={consulta?.peso ?? paciente.peso} />
          <Item
            label="Ocupación"
            value={consulta?.ocupacion ?? paciente.ocupacion}
          />
        </Grid>
      </Section>

      {/* ───────────── MOTIVO / HISTORIA ───────────── */}
      <Section
        title="Motivo e historia clínica"
        icon={<ClipboardList className="w-4 h-4" />}
      >
        <Block label="Motivo de consulta" value={consulta?.motivo} />
        <Block label="Notas clínicas iniciales" value={consulta?.notas} />
      </Section>

      {/* ───────────── ANTECEDENTES Y HÁBITOS ───────────── */}
      <Section
        title="Antecedentes y hábitos"
        icon={<Activity className="w-10 h-5" />}
      >
        <Grid>
          {/* Hábitos */}
          <Bool label="Fuma" value={consulta?.fuma} />
          <Bool label="Consume alcohol" value={consulta?.alcohol} />

          {/* Enfermedades */}
          <Bool label="Diabetes" value={consulta?.diabetes} />
          <Bool label="Hipotiroidismo" value={consulta?.hipotiroidismo} />
          <Item label="Menopausia" value={consulta?.menopausia} />

          {/* Fracturas */}
          <Bool label="Fracturas previas" value={consulta?.fracturas} />
          <Item label="Lugar de fractura" value={consulta?.lugarFractura} />

          {/* Familiares */}
          <Bool
            label="Familiares con osteoporosis"
            value={consulta?.familiaresOsteoporosis}
          />
          <Item
            label="Quiénes (osteoporosis)"
            value={consulta?.quienesOsteoporosis}
          />

          <Bool
            label="Familiares con osteoartritis"
            value={consulta?.familiaresOsteoartritis}
          />
          <Item
            label="Quiénes (osteoartritis)"
            value={consulta?.quienesOsteoartritis}
          />

          {/* Medicamentos */}
          <Bool
            label="Toma medicamentos controlados"
            value={consulta?.medicamentos}
          />
          <Item
            label="Cuáles medicamentos"
            value={consulta?.cualesMedicamentos}
          />
        </Grid>

        <Block
          label="Actividad física"
          value={consulta?.actividadFisica}
        />
      </Section>

      {/* ───────────── ESTUDIOS Y DIAGNÓSTICO ───────────── */}
      <Section
        title="Estudios y diagnóstico inicial"
        icon={<AlertTriangle className="w-4 h-4" />}
      >
        <Grid>
         {/* <Bool
            label="Presencia de osteoporosis"
            value={consulta?.tieneOsteoporosis}
          />
          <Bool
            label="Presencia de osteoartritis"
            value={consulta?.tieneOsteoartritis}
          />*/}
          <Bool label="Requiere más estudios" value={consulta?.requiereEstudios} />
          <Item label="Cuáles estudios" value={consulta?.cualesEstudios} />
        </Grid>

        <Block label="Diagnóstico clínico" value={consulta?.diagnostico} />

      { /* <div className="mt-3 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/40 px-4 py-3">
          <p className="text-xs font-semibold text-cyan-900">Resultado IA:</p>
          <p className="text-sm text-cyan-800">
            {consulta?.resultadoIA || 'Pendiente de análisis automático (modelo IA).'}
          </p>
        </div>*/}
      </Section>

      {/* ───────────── RADIOGRAFÍA INICIAL ───────────── */}
 <Section
  title="Imágenes de la primera consulta"
  icon={<ImageIcon className="w-4 h-4" />}
>
  {consulta?.radiografia || imagenProcesada || imagenEtiquetada ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Radiografía Original */}
      {consulta?.radiografia && (
        <div>
          <p className="text-sm font-semibold mb-2 text-slate-700">Radiografía original</p>
          <img
            src={consulta.radiografia}
            alt="Radiografía inicial"
            className="w-full h-auto rounded-xl border object-contain"
          />
        </div>
      )}

      {/* Imagen Procesada */}
      {imagenProcesada && (
        <div>
          <p className="text-sm font-semibold mb-2 text-slate-700">Imagen procesada</p>
          <img
            src={imagenProcesada}
            alt="Procesada IA"
            className="w-full h-auto rounded-xl border object-contain"
          />
        </div>
      )}

      {/* Imagen Etiquetada */}
      {imagenEtiquetada && (
        <div>
          <p className="text-sm font-semibold mb-2 text-slate-700">Imagen etiquetada</p>
          <img
            src={imagenEtiquetada}
            alt="Etiquetada IA"
            className="w-full h-auto rounded-xl border object-contain"
          />
        </div>
      )}
    </div>
  ) : (
    <p className="text-sm text-slate-500 italic">
      No hay imágenes registradas para esta consulta inicial.
    </p>
  )}
</Section>


      {/* ───────────── DATOS DEL MÉDICO ───────────── */}
      <Section
        title="Datos del médico"
        icon={<Stethoscope className="w-8 h-4" />}
      >
        <Grid>
          <Item label="Nombre" value={consulta?.medico_nombre} />
          <Item label="Correo" value={consulta?.medico_correo} />
          <Item label="Teléfono" value={consulta?.medico_telefono} />
          <Item label="Especialidad" value={consulta?.medico_especialidad} />
          <Item label="Cédula profesional" value={consulta?.medico_cedula} />
        </Grid>
      </Section>
    </div>
  );
}

/* ───────────── Helpers de UI ───────────── */

function Section({ title, icon, children }: any) {
  return (
    <section className="bg-white/95 border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
          {icon}
        </div>
        <h2 className="text-sm md:text-base font-semibold text-slate-800">
          {title}
        </h2>
      </div>
      <div className="text-sm text-slate-700">{children}</div>
    </section>
  );
}

function Grid({ children }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
      {children}
    </div>
  );
}

function Item({ label, value }: any) {
  if (!value && value !== false) return null;
  return (
    <p className="text-[13px]">
      <b className="text-slate-800">{label}: </b>
      {value}
    </p>
  );
}

function Bool({ label, value }: any) {
  if (value === undefined || value === null) return null;
  return (
    <p className="text-[13px]">
      <b className="text-slate-800">{label}: </b>
      {value ? 'Sí' : 'No'}
    </p>
  );
}

function Block({ label, value }: any) {
  if (!value) return null;
  return (
    <div className="text-[13px]">
      <p className="font-semibold text-slate-800">{label}:</p>
      <p className="whitespace-pre-line">{value}</p>
    </div>
  );
}
