import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const paciente = await req.json()

    if (!paciente.medicoId) {
      return NextResponse.json(
        { ok: false, error: 'Falta medicoId' },
        { status: 400 }
      )
    }

    // 1) Crear paciente
    const { data: pacienteDb, error: errPaciente } = await supabaseAdmin
      .from('pacientes')
      .insert([
        {
          nombre: paciente.nombre,
          correo: paciente.correo,
          telefono: paciente.telefono,
          edad: paciente.edad,
          sexo: paciente.sexo,
          estatura: paciente.estatura,
          peso: paciente.peso,
          ocupacion: paciente.ocupacion,
        },
      ])
      .select()
      .single()

    if (errPaciente) {
      console.error(errPaciente)
      return NextResponse.json({ ok: false, error: errPaciente.message })
    }

    const pacienteId = pacienteDb.id

    // 2) Crear primera consulta automática
    const { error: errConsulta } = await supabaseAdmin
      .from('consultas')
      .insert([
        {
          paciente_id: pacienteId,
          motivo: paciente.motivoConsulta,
          notas: paciente.notasClinicas,
          diagnostico: paciente.diagnostico,
          actividadfisica: paciente.actividadFisica,
          estudios: paciente.cualesEstudios,
          resultadoia: paciente.resultadoIA,
          radiografia: paciente.radiografia,

          fuma: paciente.fuma,
          alcohol: paciente.alcohol,
          fracturas: paciente.fracturas,
          lugarfractura: paciente.lugarFractura,

          familiaresosteo: paciente.familiaresOsteoporosis,
          quienesosteo: paciente.quienesOsteoporosis,
          familiaresosteoart: paciente.familiaresOsteoartritis,
          quienesosteoart: paciente.quienesOsteoartritis,
          medicamentos: paciente.medicamentos,
          cualesmedica: paciente.cualesMedicamentos,

          tieneosteopor: paciente.tieneOsteoporosis,
          tieneosteoart: paciente.tieneOsteoartritis,

          medico_id: paciente.medicoId,
          medico_nombre: paciente.medicoNombre,
          medico_correo: paciente.medicoCorreo,
        },
      ])

    if (errConsulta) {
      console.error(errConsulta)
      return NextResponse.json({ ok: false, error: errConsulta.message })
    }

    return NextResponse.json({ ok: true })

  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { ok: false, error: 'Error inesperado' },
      { status: 500 }
    )
  }
}
