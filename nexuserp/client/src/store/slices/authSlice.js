import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    sessionStorage.setItem('token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: sessionStorage.getItem('token'), loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null; state.token = null
      sessionStorage.removeItem('token')
    },
    clearError(state) { state.error = null }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending,   s => { s.loading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token })
      .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload.user })
      .addCase(fetchMe.rejected,  (s) => { s.user = null; s.token = null; sessionStorage.removeItem('token') })
  }
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
