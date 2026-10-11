import { UserRound } from 'lucide-react';

export type ProfilePreferences = { name: string; weightReminder: boolean; bodyReminder: boolean };
export const defaultProfilePreferences = (): ProfilePreferences => ({ name: '', weightReminder: false, bodyReminder: false });

export function ProfileView({ preferences, onChange }: { preferences: ProfilePreferences; onChange: (preferences: ProfilePreferences) => void }) {
  return <>
    <header className="blw-page-header"><h2>Perfil</h2><span>Configuración de Balance</span></header>
    <div className="blw-feed blw-profile-feed">
      <div className="blw-profile-identity"><span aria-hidden="true"><UserRound size={28} strokeWidth={1.3} /></span><div><strong>{preferences.name.trim() || 'Tu perfil'}</strong><small>Cuenta y preferencias</small></div></div>
      <section className="blw-profile-section" aria-label="Cuenta"><h3>Cuenta</h3><label className="blw-field">Nombre<input autoComplete="off" value={preferences.name} placeholder="Tu nombre" maxLength={80} onChange={(event) => onChange({ ...preferences, name: event.target.value })} /></label></section>
      <section className="blw-profile-section" aria-label="Unidades actuales"><h3>Unidades</h3><dl className="blw-body-record"><div><dt>Peso</dt><dd>kg</dd></div><div><dt>Medidas corporales</dt><dd>cm</dd></div><div><dt>Energía</dt><dd>kcal</dd></div></dl></section>
      <section className="blw-profile-section" aria-label="Preferencias de recordatorios"><h3>Recordatorios</h3>
        <label className="blw-preference-row"><span>Peso<small>Registro diario</small></span><input type="checkbox" checked={preferences.weightReminder} onChange={(event) => onChange({ ...preferences, weightReminder: event.target.checked })} /></label>
        <label className="blw-preference-row"><span>Medidas corporales<small>Registro ocasional</small></span><input type="checkbox" checked={preferences.bodyReminder} onChange={(event) => onChange({ ...preferences, bodyReminder: event.target.checked })} /></label>
      </section>
    </div>
  </>;
}
