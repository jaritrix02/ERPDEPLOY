import { useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FormRow } from '../ui'

export function DepartmentForm({ onSave, onCancel, initialData = { name: '', location: '' } }) {
  const [form, setForm] = useState(initialData)
  const save = async () => {
    try {
      if (!form.name) return toast.error('Name is required')
      const res = await api.post('/departments', form)
      toast.success('Department added')
      onSave(res.data.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }
  return (
    <div className="space-y-6">
      <FormRow cols={1}>
        <div><label className="label">Department Name *</label><input className="input-field uppercase font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })} placeholder="e.g. PRODUCTION" /></div>
        <div><label className="label">Functional Location</label><input className="input-field uppercase font-bold" value={form.location} onChange={e => setForm({ ...form, location: e.target.value.toUpperCase() })} placeholder="e.g. BLOCK-A" /></div>
      </FormRow>
      <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
        <button className="btn-secondary px-8" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-12" onClick={save}>Save Department</button>
      </div>
    </div>
  )
}

export function DesignationForm({ onSave, onCancel, initialData = { name: '' } }) {
  const [form, setForm] = useState(initialData)
  const save = async () => {
    try {
      if (!form.name) return toast.error('Name is required')
      const res = await api.post('/designations', form)
      toast.success('Designation added')
      onSave(res.data.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }
  return (
    <div className="space-y-6">
      <FormRow cols={1}>
        <div><label className="label">Designation Name *</label><input className="input-field uppercase font-bold" value={form.name} onChange={e => setForm({ name: e.target.value.toUpperCase() })} placeholder="e.g. SENIOR MANAGER" /></div>
      </FormRow>
      <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
        <button className="btn-secondary px-8" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-12" onClick={save}>Save Designation</button>
      </div>
    </div>
  )
}

export function CategoryForm({ onSave, onCancel, initialData = { name: '' } }) {
  const [form, setForm] = useState(initialData)
  const save = async () => {
    try {
      if (!form.name) return toast.error('Name is required')
      const res = await api.post('/employee-categories', form)
      toast.success('Category added')
      onSave(res.data.data)
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }
  return (
    <div className="space-y-6">
      <FormRow cols={1}>
        <div><label className="label">Category Name *</label><input className="input-field uppercase font-bold" value={form.name} onChange={e => setForm({ name: e.target.value.toUpperCase() })} placeholder="e.g. STAFF" /></div>
      </FormRow>
      <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
        <button className="btn-secondary px-8" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-12" onClick={save}>Save Category</button>
      </div>
    </div>
  )
}
