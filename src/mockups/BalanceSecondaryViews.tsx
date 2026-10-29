import { useEffect, useId, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ChevronRight, Plus, Search, UserRound, Utensils } from 'lucide-react';
import type { Food } from './BalanceFoodModel';
import { formatFoodNumber } from './BalanceFoodModel';
import { foodLibrary } from './BalanceFoodRegistration';

export type SecondaryScreen = 'library' | 'food' | 'new-food' | 'settings' | 'import' | 'login' | 'callback' | 'logout';
export type ReviewState = 'ready' | 'loading' | 'empty' | 'error' | 'missing' | 'saving';
export const SECONDARY_SCREENS: [SecondaryScreen, string][] = [['library', 'Biblioteca'], ['food', 'Ficha personal'], ['new-food', 'Nuevo alimento'], ['settings', 'Cuenta y configuración'], ['import', 'Importar MacroFactor'], ['login', 'Acceso'], ['callback', 'Retorno de acceso'], ['logout', 'Retorno de salida']];
export function ReviewStatus({ state, onRetry }: { state: ReviewState; onRetry: () => void }) {
  if (state === 'ready') return null;
  return <section className="blw-state-card" role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-busy={state === 'loading' || state === 'saving'}>
    <strong>{({ loading: 'Cargando…', empty: 'Sin registros', error: 'No se pudo completar la acción', missing: 'Este registro ya no está disponible', saving: 'Guardando…' })[state]}</strong>
    <p>{state === 'error' ? 'Conservamos los datos y el formulario. Revisa la conexión y vuelve a intentarlo.' : state === 'empty' ? 'Elige otra fecha o agrega tu primer registro.' : state === 'missing' ? 'Vuelve a la lista para elegir otro registro.' : 'Espera un momento para continuar.'}</p>
    {state === 'error' && <button type="button" onClick={onRetry}>Reintentar</button>}
  </section>;
}

export function CurrentProfile({ showWeight, onWeight, onOpen }: { showWeight: boolean; onWeight: (value: boolean) => void; onOpen: (screen: SecondaryScreen) => void }) {
  return <><header className="blw-page-header"><h2>Perfil</h2><span>Tu cuenta y tus herramientas</span></header><div className="blw-feed blw-secondary-content">
    <section className="blw-profile-identity"><UserRound aria-hidden="true" /><div><strong>Modo invitado</strong><small>Datos en este dispositivo</small></div></section>
    <section className="blw-secondary-card"><h3>Preferencias</h3><label className="blw-preference-row"><span>Seguimiento de peso<small>Tu historial se conserva al desactivar</small></span><input type="checkbox" checked={showWeight} onChange={e => onWeight(e.target.checked)} /></label><p>kg · g / ml · kcal</p></section>
    <section className="blw-secondary-card"><h3>Herramientas</h3>{SECONDARY_SCREENS.filter(([id]) => ['library', 'import', 'settings'].includes(id)).map(([id, label]) => <button className="blw-tool-link" key={id} onClick={() => onOpen(id)}><span>{label}</span><ChevronRight size={18} aria-hidden="true" /></button>)}</section>
  </div></>;
}

type Props = { appearance: 'dark' | 'light'; onAppearance: (value: 'dark' | 'light') => void; palette: string; onPalette: (value: string) => void; screen: SecondaryScreen; onOpen: (screen: SecondaryScreen) => void; onBack: () => void; onComplete: () => void; foods: Food[]; state: ReviewState; onState: (state: ReviewState) => void; themeClass: string; showWeight: boolean; onWeight: (value: boolean) => void };
export function BalanceSecondaryViews({ appearance, onAppearance, palette, onPalette, screen, onOpen, onBack, onComplete, foods, state, onState, themeClass, showWeight, onWeight }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [chosen, setChosen] = useState<Food | null>(null);
  const [official, setOfficial] = useState(false);
  const [name, setName] = useState('Yogur natural');
  const [portion, setPortion] = useState('100 g');
  const [category, setCategory] = useState('Lácteos');
  const [hour, setHour] = useState('08:30');
  const [nutrients, setNutrients] = useState<Record<string, string>>({ Energía: '95', Proteínas: '15', Carbohidratos: '6', Grasas: '1' });
  const [seals, setSeals] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<'delete' | 'logout' | 'forget' | null>(null);
  const [remembered, setRemembered] = useState(true);
  const [account, setAccount] = useState<'guest' | 'connected'>('guest');
  const [phase, setPhase] = useState<'idle' | 'reading' | 'preview' | 'invalid' | 'importing' | 'complete'>('idle');
  const [draftSaved, setDraftSaved] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);
  const title = screen === 'food' && official ? 'Ficha oficial' : SECONDARY_SCREENS.find(([id]) => id === screen)![1];
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useId();
  useEffect(() => { heading.current?.focus(); setNotice(''); setError(''); if (screen === 'new-food') { setName(''); setPortion('100 g'); setCategory(''); setNutrients({}); setSeals([]); setOfficial(false); setDraftSaved(false); } }, [screen]);
  const busy = state === 'loading' || state === 'saving';
  const editable = screen === 'new-food' || !official;
  const openFood = (food: Food, isOfficial: boolean) => { setChosen(food); setName(food.name); setPortion(food.portion); setOfficial(isOfficial); setDraftSaved(false); setNutrients({ Energía: String(food.calories), Proteínas: String(food.protein), Carbohidratos: String(food.carbs), Grasas: String(food.fat) }); onOpen('food'); };
  const startNew = () => { setChosen(null); setName(''); setPortion('100 g'); setCategory(''); setNutrients({}); setSeals([]); setOfficial(false); setDraftSaved(false); onOpen('new-food'); };
  const listing = foods.filter((food) => !deleted.includes(food.id) && food.name.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')) && (filter === 'all' || filter === foodLibrary(food)));
  const tool = (label: string, action: () => void) => <button type="button" className="blw-tool-link" onClick={action} disabled={busy}><span>{label}</span><ChevronRight size={18} aria-hidden="true" /></button>;
  return <><header className="blw-add-header">{!['login', 'callback', 'logout'].includes(screen) && <button onClick={onBack} aria-label="Volver" disabled={busy}><ArrowLeft size={20} /></button>}<h2 ref={heading} tabIndex={-1}>{title}</h2>{screen === 'library' && <button className="blw-catalog-create" onClick={startNew} aria-label="Crear alimento" disabled={busy}><Plus size={20} aria-hidden="true" /></button>}</header>
    <div className={`blw-feed blw-secondary-content${screen === 'library' ? ' blw-catalog' : ''}`}>
      <ReviewStatus state={state} onRetry={() => onState('ready')} />
      {notice && <p className="blw-state-card" role="status">{notice}</p>}
      {(screen === 'library') && <>
        <div className="blw-catalog-controls">
          <div className="blw-library-search"><label><Search size={18} aria-hidden="true" /><input type="search" aria-label="Buscar en biblioteca" placeholder="Buscar un alimento" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
          <div className="blw-catalog-filters" role="group" aria-label="Biblioteca">{[['all', 'Todas'], ['personal', 'Personal'], ['official', 'Oficial']].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
        </div>
        <div className="blw-catalog-caption"><span>{filter === 'personal' ? 'Tu biblioteca' : filter === 'official' ? 'Biblioteca oficial' : 'Tus alimentos y referencias'}</span><span>{state === 'empty' ? 0 : listing.length} alimentos</span></div>
        {state !== 'empty' && state !== 'loading' && listing.length > 0 && <ul className="blw-catalog-list" aria-label="Alimentos de biblioteca">{listing.map(food => <li key={food.id}><button className="blw-catalog-row" onClick={() => openFood(food, foodLibrary(food) === 'official')}>
          <span className="blw-catalog-copy"><strong>{food.name}</strong><small>{food.portion}<span aria-hidden="true"> · </span>{foodLibrary(food) === 'official' ? 'Oficial' : 'Personal'}</small></span>
          <span className="blw-catalog-energy"><strong>{formatFoodNumber(food.calories)}</strong><small>kcal</small></span>
        </button></li>)}</ul>}
        {(state === 'empty' || !listing.length) && <section className="blw-catalog-empty"><Utensils size={28} aria-hidden="true" /><h3>{query ? 'Sin coincidencias' : 'Tu biblioteca empieza aquí'}</h3><p>{query ? 'Prueba con otro nombre o cambia de biblioteca.' : 'Guarda un alimento para encontrarlo al registrar.'}</p><button onClick={startNew}>Crear alimento</button></section>}
      </>}
      {(screen === 'food' || screen === 'new-food') && state !== 'missing' && <form id={form} onSubmit={e => { e.preventDefault(); if (!name.trim() || !portion.trim() || ['Energía', 'Proteínas', 'Carbohidratos', 'Grasas'].some(k => !nutrients[k]?.trim() || !Number.isFinite(Number(nutrients[k])) || Number(nutrients[k]) < 0)) { setError('Completa nombre, porción y los cuatro nutrientes principales con valores válidos.'); return; } setError(''); setDraftSaved(true); setNotice('Ficha guardada en el ejemplo. No se modificó tu biblioteca real.'); }}>
        <p>{editable ? 'Tu alimento · ficha personal' : 'Referencia oficial · solo lectura'}</p>
        <fieldset disabled={!editable || busy} className="blw-secondary-card"><legend>Identidad y porción</legend>
          <label className="blw-field">Nombre<input value={name} maxLength={160} onChange={e => { setName(e.target.value); setDraftSaved(false); }} /></label>
          <label className="blw-field">Porción de referencia<input value={portion} onChange={e => setPortion(e.target.value)} placeholder="100 g, 250 ml o 1 unidad" /></label>
          <div className="blw-quantity-fields"><label className="blw-field">Hora habitual<input type="time" required value={hour} onChange={e => setHour(e.target.value)} /></label><label className="blw-field">Categoría<input value={category} onChange={e => setCategory(e.target.value)} /></label></div>
        </fieldset>
        <fieldset disabled={!editable || busy} className="blw-secondary-card"><legend>Información por {portion || 'porción'}</legend><div className="blw-secondary-grid">{['Energía', 'Proteínas', 'Carbohidratos', 'Grasas', 'Fibra', 'Sodio', 'Colesterol'].map((key, i) => <label key={key} className="blw-field">{key} ({i === 0 ? 'kcal' : i > 4 ? 'mg' : 'g'}){i > 3 ? ' · opcional' : ''}<input inputMode="decimal" type="number" min="0" step="any" value={nutrients[key] ?? ''} onChange={e => setNutrients({ ...nutrients, [key]: e.target.value })} /></label>)}</div><p>Sin valor no equivale a cero.</p></fieldset>
        <fieldset disabled={!editable || busy} className="blw-secondary-card"><legend>Sellos chilenos</legend>{['Calorías', 'Azúcares', 'Grasas saturadas', 'Sodio'].map(seal => <label key={seal} className="blw-preference-row"><span>Alto en {seal.toLowerCase()}</span><input type="checkbox" checked={seals.includes(seal)} onChange={e => setSeals(e.target.checked ? [...seals, seal] : seals.filter(s => s !== seal))} /></label>)}</fieldset>
        {error && <p role="alert">{error}</p>}
        {screen === 'food' && editable && <button type="button" className="blw-danger" onClick={() => setConfirm('delete')}>Eliminar alimento</button>}
      </form>}
      {screen === 'settings' && <>
        <section className="blw-secondary-card"><h3>Seguimiento</h3><label className="blw-preference-row"><span>Registrar peso<small>Se conserva tu historial</small></span><input type="checkbox" checked={showWeight} disabled={busy} onChange={e => onWeight(e.target.checked)} /></label></section>
        <section className="blw-secondary-card"><h3>Apariencia</h3><label className="blw-field">Modo<select aria-label="Modo" value={appearance} onChange={e => onAppearance(e.target.value as 'dark' | 'light')}><option value="system" disabled>Sistema · objetivo Android</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label><label className="blw-field">Colores<select aria-label="Colores" value={palette} onChange={e => onPalette(e.target.value)}><option value="system" disabled>Sistema · objetivo Android</option><option value="forest">Bosque</option><option value="lagoon">Laguna</option><option value="lavender">Lavanda</option><option value="peach">Durazno</option></select></label></section>
        <section className="blw-secondary-card"><h3>Datos</h3>{tool('Importar desde MacroFactor', () => onOpen('import'))}</section>
        <section className="blw-secondary-card"><h3>Cuenta</h3><strong>{account === 'guest' ? 'Modo invitado' : 'Cuenta conectada de ejemplo'}</strong><p>{account === 'guest' ? 'Los datos permanecen en este dispositivo.' : 'Sesión autenticada'}</p><button className="blw-danger" disabled={busy} onClick={() => setConfirm('logout')}>{account === 'guest' ? 'Salir del modo invitado' : 'Cerrar sesión'}</button></section>
      </>}
      {screen === 'import' && <>
        <section className="blw-secondary-card"><h3>Trae tu historial</h3><p>Revisa los cambios antes de importar una exportación MacroFactor.</p><p>XLSX / CSV · hasta 25 MB</p><button className="blw-secondary-primary" disabled={busy || phase === 'importing'} onClick={() => setPhase('reading')}>{phase === 'idle' ? 'Seleccionar archivo de ejemplo' : 'Elegir otro ejemplo'}</button></section>
        {phase === 'reading' && <section className="blw-secondary-card" role="status"><h3>Leyendo exportación…</h3><p>historial-ejemplo.xlsx</p><button onClick={() => setPhase('preview')}>Ver resultado de lectura</button></section>}
        {['preview', 'invalid', 'importing', 'complete'].includes(phase) && <section className="blw-secondary-card"><h3>{phase === 'complete' ? 'Importación completada' : 'Revisar cambios'}</h3><p>historial-ejemplo.xlsx · datos ilustrativos</p><dl className="blw-body-record"><div><dt>Alimentos</dt><dd>8 nuevos · 2 actualizados</dd></div><div><dt>Consumos</dt><dd>24 nuevos · 4 sin cambios</dd></div><div><dt>Registros reemplazados del importador</dt><dd>2</dd></div></dl><p>Los registros que creaste manualmente se conservan.</p>
          {phase === 'preview' && <><button className="blw-secondary-primary" onClick={() => setPhase('importing')}>Importar a Balance (simulación)</button><button onClick={() => setPhase('invalid')}>Revisar ejemplo con filas inválidas</button></>}
          {phase === 'invalid' && <div role="alert"><h3>2 filas impiden importar</h3><p>Fila 4: falta una fecha válida. Ningún dato cambiará hasta elegir un archivo válido.</p><button onClick={() => setPhase('reading')}>Elegir otro archivo</button></div>}
          {phase === 'importing' && <><label>Importando historial<progress max="24" value="12" /></label><p role="status">12 de 24 registros</p><button onClick={() => setPhase('complete')}>Ver resultado de ejemplo</button></>}
          {phase === 'complete' && <p role="status">24 consumos incorporados al ejemplo. No se subió ningún archivo ni se alteraron datos.</p>}
        </section>}
      </>}
      {screen === 'login' && <>
        <div className="blw-access-intro"><span>Tu registro cotidiano</span><h3>Balance</h3><p>Elige cómo continuar.</p></div>
        {remembered && <section className="blw-secondary-card"><UserRound aria-hidden="true" /><h3>Cuenta de ejemplo</h3><p>Recordada en este dispositivo</p><button className="blw-secondary-primary" disabled={busy} onClick={() => onOpen('callback')}>Continuar con la cuenta recordada</button><button disabled={busy} onClick={() => setConfirm('forget')}>Olvidar esta cuenta</button></section>}
        <section className="blw-secondary-card"><button className="blw-secondary-primary" disabled={busy} onClick={() => onOpen('callback')}>{remembered ? 'Usar otra cuenta de Google' : 'Continuar con Google'}</button><button disabled={busy} onClick={() => { setAccount('guest'); onComplete(); }}>Continuar como invitado</button><p>Sin cuenta. Registros en este dispositivo.</p></section>
      </>}
      {screen === 'callback' && <section className="blw-secondary-card"><h3>Volviendo a Balance</h3><p role="status">{state === 'error' ? 'No se pudo completar el acceso. Vuelve a intentarlo.' : 'Comprobando el acceso…'}</p><button onClick={() => { setAccount('connected'); onComplete(); }}>Ver regreso al diario</button><button onClick={() => onOpen('login')}>Volver al acceso</button></section>}
      {screen === 'logout' && <section className="blw-secondary-card"><h3>Sesión cerrada en Balance</h3><p>{state === 'error' ? 'No se pudo confirmar el cierre completo. Vuelve a intentarlo cuando tengas conexión.' : 'Puedes elegir cómo continuar.'}</p><button onClick={() => onOpen('login')}>Ir al acceso</button></section>}
    </div>
    {(screen === 'food' || screen === 'new-food') && editable && state !== 'missing' && <footer className="blw-add-confirm"><span>{draftSaved ? 'Ejemplo guardado' : 'Ficha de biblioteca'}</span><button type="submit" form={form} disabled={busy}>{busy ? 'Guardando…' : screen === 'new-food' ? 'Crear alimento' : 'Guardar cambios'}</button></footer>}
    <Dialog.Root open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}><Dialog.Portal><Dialog.Backdrop className="blw-dialog-backdrop" /><Dialog.Popup className={`blw-dialog ${themeClass}`}><div className="blw-dialog-heading"><Dialog.Title>{confirm === 'delete' ? 'Eliminar alimento' : confirm === 'forget' ? 'Olvidar esta cuenta' : 'Cerrar sesión'}</Dialog.Title><Dialog.Description>{confirm === 'delete' ? 'Dejará de aparecer en tu biblioteca. Los consumos anteriores conservan sus datos.' : confirm === 'forget' ? 'Se quitará la cuenta recordada de este dispositivo.' : 'Podrás volver a acceder desde la pantalla de inicio.'}</Dialog.Description></div><footer className="blw-form-actions"><Dialog.Close>Cancelar</Dialog.Close><button className="blw-sheet-primary" onClick={() => { const action = confirm; setConfirm(null); if (action === 'delete') { if (chosen) setDeleted([...deleted, chosen.id]); onOpen('library'); } else if (action === 'forget') setRemembered(false); else { setAccount('guest'); onOpen('logout'); } }}>{confirm === 'delete' ? 'Eliminar' : confirm === 'forget' ? 'Olvidar cuenta' : 'Cerrar sesión'}</button></footer></Dialog.Popup></Dialog.Portal></Dialog.Root>
  </>;
}
