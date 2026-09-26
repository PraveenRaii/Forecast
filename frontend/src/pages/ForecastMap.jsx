import { useEffect, useState } from 'react'
import { getMap } from '../services/api'
import ConfidenceMap from '../components/ConfidenceMap'
import DaySelector from '../components/DaySelector'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
export default function ForecastMap(){const [day,setDay]=useState(1),[data,setData]=useState(),[error,setError]=useState();const load=()=>{setError();getMap(day).then(setData).catch(setError)};useEffect(load,[day]);if(error)return <ErrorState error={error} retry={load}/>;if(!data)return <LoadingState/>;return <div className="space-y-6"><div><p className="label">Geospatial analysis</p><h1 className="text-2xl font-bold">India confidence map</h1></div><DaySelector day={day} onChange={setDay}/><ConfidenceMap points={data.points}/><p className="text-sm text-slate-500">Green points have higher forecast confidence; orange and red points warrant closer review. Geographic markers represent regional sample points in demo mode.</p></div>}
