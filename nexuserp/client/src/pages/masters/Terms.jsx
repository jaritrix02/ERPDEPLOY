import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Spinner } from '../../components/ui'

/* ─── Default clause library (pre-loaded suggestions) ─────────────────────── */
const CLAUSE_LIBRARY = [
  'Payment shall be made within 30 days from the date of invoice.',
  'All goods are subject to inspection and acceptance at the buyer\'s premises.',
  'Prices quoted are inclusive of all taxes unless stated otherwise.',
  'Delivery shall be made within the agreed timeframe; delays must be notified in writing.',
  'Defective goods must be reported within 7 days of receipt.',
  'The vendor shall maintain strict confidentiality of all business information.',
  'Force Majeure events must be notified within 48 hours in writing.',
  'All disputes shall be subject to the jurisdiction of local courts only.',
  'Warranty period of 12 months from date of delivery is applicable.',
  'The vendor shall comply with all applicable statutory and regulatory requirements.',
  'Purchase Order number must be mentioned on all invoices and packing lists.',
  'Partial shipments are not accepted unless prior written approval is obtained.',
  'The buyer reserves the right to reject goods not conforming to specifications.',
  'Any price revisions require a minimum 30-day prior written notice.',
  'Vendor shall provide Certificate of Conformance (COC) with each shipment.',
]

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ─── Modal Overlay ─────────────────────────────────────────────────────────── */
function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white dark:bg-[#111] shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-base font-black uppercase tracking-tight text-black dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function Terms() {
  const [list, setList]       = useState([])  // All term records from DB
  const [loading, setLoading] = useState(true)

  // Drawer: Create / Edit a Terms Template
  const [drawer, setDrawer]   = useState(false)
  const [editing, setEditing] = useState(null) // null = new, else = id

  // Form State
  const [title, setTitle]     = useState('')
  const [points, setPoints]   = useState(['']) // array of string clauses
  const [newPoint, setNewPoint] = useState('')
  const inputRef = useRef(null)

  // Selection Drawer (for PO / Vendor use)
  const [selectDrawer, setSelectDrawer] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState(null) // the template being previewed
  const [selectedPoints, setSelectedPoints] = useState({}) // { pointIndex: bool }
  const [copiedText, setCopiedText] = useState(false)

  /* ── Load ── */
  const load = () => {
    api.get('/terms')
      .then(r => setList(r.data.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  /* ── Open Create / Edit Drawer ── */
  const openCreate = () => {
    setTitle(''); setPoints(['']); setEditing(null); setDrawer(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }
  const openEdit = (t) => {
    let pts = []
    try { pts = JSON.parse(t.content) } catch { pts = [t.content] }
    setTitle(t.title)
    setPoints(Array.isArray(pts) ? pts : [t.content])
    setEditing(t.id)
    setDrawer(true)
  }

  /* ── Point Management ── */
  const addPoint = (text) => {
    const val = (text || newPoint).trim()
    if (!val) return
    setPoints(p => [...p.filter(x => x.trim()), val])
    setNewPoint('')
  }
  const updatePoint = (i, val) => setPoints(p => p.map((x, idx) => idx === i ? val : x))
  const removePoint = (i) => setPoints(p => p.filter((_, idx) => idx !== i))
  const movePoint = (i, dir) => {
    setPoints(p => {
      const a = [...p]; const j = i + dir
      if (j < 0 || j >= a.length) return a
      ;[a[i], a[j]] = [a[j], a[i]]; return a
    })
  }

  /* ── Save ── */
  const save = async () => {
    const cleanPts = points.filter(p => p.trim())
    if (!title.trim()) return toast.error('Title is required')
    if (!cleanPts.length) return toast.error('Add at least one clause')
    try {
      const payload = { title, content: JSON.stringify(cleanPts) }
      if (editing) await api.put(`/terms/${editing}`, payload)
      else await api.post('/terms', payload)
      toast.success(editing ? 'Updated successfully' : 'Terms template created')
      setDrawer(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save') }
  }

  /* ── Delete ── */
  const del = async (id) => {
    if (!confirm('Delete this template?')) return
    try { await api.delete(`/terms/${id}`); toast.success('Deleted'); load() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  /* ── Selection Mode ── */
  const openSelect = (t) => {
    let pts = []
    try { pts = JSON.parse(t.content) } catch { pts = [t.content] }
    setSelectedTerm({ ...t, points: Array.isArray(pts) ? pts : [t.content] })
    const init = {}
    ;(Array.isArray(pts) ? pts : [t.content]).forEach((_, i) => { init[i] = true })
    setSelectedPoints(init)
    setSelectDrawer(true)
    setCopiedText(false)
  }
  const copySelected = () => {
    if (!selectedTerm) return
    const lines = selectedTerm.points
      .filter((_, i) => selectedPoints[i])
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopiedText(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedText(false), 2000)
    })
  }

  /* ── Parse content helper ── */
  const getPoints = (content) => {
    try { const p = JSON.parse(content); return Array.isArray(p) ? p : [content] }
    catch { return [content] }
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Terms & Conditions"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <PlusIcon /> New Template
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {list.length === 0 ? (
            <div className="col-span-3 py-20 text-center text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-bold uppercase">No templates yet. Create one to get started.</p>
            </div>
          ) : list.map(t => {
            const pts = getPoints(t.content)
            return (
              <div key={t.id} className="card p-0 overflow-hidden flex flex-col border border-slate-200 dark:border-white/10 hover:shadow-xl transition-shadow">
                {/* Card Header */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">T&C Template</p>
                    <h3 className="font-black text-sm text-black dark:text-white leading-tight">{t.title}</h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">{pts.length} clause{pts.length !== 1 ? 's' : ''} · {t.createdAt?.slice(0, 10)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors" title="Edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => del(t.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Delete">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Clause Preview */}
                <div className="px-5 py-4 flex-1 space-y-2.5 max-h-48 overflow-hidden">
                  {pts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="min-w-[18px] h-[18px] rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{p}</p>
                    </div>
                  ))}
                  {pts.length > 5 && (
                    <p className="text-[10px] font-bold text-slate-400 pl-7">+{pts.length - 5} more clauses...</p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
                  <button onClick={() => openSelect(t)} className="flex-1 btn-primary text-xs py-2 font-bold">
                    Select Clauses
                  </button>
                  <button onClick={() => openEdit(t)} className="flex-1 btn-secondary text-xs py-2 font-bold">
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Drawer ─────────────────────────────────────── */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? 'Edit Template' : 'New T&C Template'}>
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">Template Title *</label>
            <input
              ref={inputRef}
              className="input-field font-bold"
              placeholder="e.g. Standard Purchase Terms, Export Terms"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Clause List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Clauses / Points *</label>
              <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{points.filter(p => p.trim()).length} active</span>
            </div>

            <div className="space-y-2.5">
              {points.map((p, i) => (
                <div key={i} className="flex gap-2 items-center group">
                  <span className="min-w-[24px] h-6 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <input
                    className="input-field flex-1 text-sm py-2"
                    value={p}
                    onChange={e => updatePoint(i, e.target.value)}
                    placeholder={`Clause ${i + 1}...`}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
                  />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => movePoint(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 disabled:opacity-30 text-xs" title="Move up">↑</button>
                    <button onClick={() => movePoint(i, 1)} disabled={i === points.length - 1} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 disabled:opacity-30 text-xs" title="Move down">↓</button>
                    <button onClick={() => removePoint(i)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition-colors"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new point */}
            <div className="mt-3 flex gap-2">
              <input
                className="input-field flex-1 text-sm py-2 border-dashed"
                value={newPoint}
                onChange={e => setNewPoint(e.target.value)}
                placeholder="Type a new clause and press Enter or +"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
              />
              <button onClick={() => addPoint()} className="btn-primary px-4 py-2 text-sm font-bold flex items-center gap-1"><PlusIcon /></button>
            </div>
          </div>

          {/* Clause Library */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Quick Add from Library</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {CLAUSE_LIBRARY.filter(c => !points.includes(c)).map((c, i) => (
                <button
                  key={i}
                  onClick={() => addPoint(c)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <div className="flex gap-2 items-start">
                    <span className="text-blue-400 group-hover:text-blue-600 transition-colors mt-0.5 flex-shrink-0"><PlusIcon /></span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-relaxed">{c}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
            <button onClick={() => setDrawer(false)} className="btn-secondary flex-1 font-bold">Cancel</button>
            <button onClick={save} className="btn-primary flex-1 font-bold">{editing ? 'Save Changes' : 'Create Template'}</button>
          </div>
        </div>
      </Drawer>

      {/* ── Select Clauses Drawer ─────────────────────────────────────── */}
      <Drawer open={selectDrawer} onClose={() => setSelectDrawer(false)} title={`Select Clauses — ${selectedTerm?.title || ''}`}>
        {selectedTerm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {Object.values(selectedPoints).filter(Boolean).length} of {selectedTerm.points.length} clauses selected
              </p>
              <div className="flex gap-2">
                <button onClick={() => { const all = {}; selectedTerm.points.forEach((_, i) => all[i] = true); setSelectedPoints(all) }} className="text-[10px] font-black text-blue-500 hover:underline uppercase">All</button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button onClick={() => setSelectedPoints({})} className="text-[10px] font-black text-slate-400 hover:underline uppercase">None</button>
              </div>
            </div>

            <div className="space-y-3">
              {selectedTerm.points.map((p, i) => (
                <label key={i} className={`flex gap-3 items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPoints[i] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
                  <input
                    type="checkbox"
                    checked={!!selectedPoints[i]}
                    onChange={e => setSelectedPoints(p => ({ ...p, [i]: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex gap-2 items-start flex-1">
                    <span className={`min-w-[20px] h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0 ${selectedPoints[i] ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>{i + 1}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{p}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Preview of selected */}
            {Object.values(selectedPoints).some(Boolean) && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Preview</p>
                {selectedTerm.points.filter((_, i) => selectedPoints[i]).map((p, i) => (
                  <p key={i} className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{i + 1}. </span>{p}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <button onClick={() => setSelectDrawer(false)} className="btn-secondary flex-1 font-bold">Close</button>
              <button onClick={copySelected} disabled={!Object.values(selectedPoints).some(Boolean)} className="btn-primary flex-1 font-bold flex items-center justify-center gap-2">
                {copiedText ? '✓ Copied!' : '📋 Copy Selected'}
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
