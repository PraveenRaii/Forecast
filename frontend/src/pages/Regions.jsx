import { useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import { getRegions } from '../services/api'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
export default function Regions(){const [data,setData]=useState(),[error,setError]=useState();const load=()=>{setError();getRegions().then(setData).catch(setError)};useEffect(load,[]);if(error)return <ErrorState error={error} retry={load}/>;if(!data)return <LoadingState/>;return <div><p className="label">Regional analysis</p><h1 className="mb-5 text-2xl font-bold">Monitored regions</h1><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.data.map(r=><Link className="card hover:border-cyan-400" key={r.id} to={`/regions/${r.id}`}><p className="font-semibold">{r.name}</p><p className="mt-1 text-sm text-slate-500">{r.latitude.toFixed(2)}°N · {r.longitude.toFixed(2)}°E</p></Link>)}</div></div>}
