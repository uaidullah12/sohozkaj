import Link from 'next/link'

const items = [
  {label:'হোম', href:'/'},
  {label:'ডকুমেন্ট', href:'/documents'},
  {label:'+', href:'#', center:true},
  {label:'ছবি', href:'/tools/image-convert'},
  {label:'প্রোফাইল', href:'/profile'}
]

export default function MobileBottomNav(){
  return (
    <nav className="fixed bottom-3 left-0 right-0 flex justify-center z-40">
      <div className="w-full max-w-3xl px-4">
        <div className="bg-white rounded-2xl shadow-lg flex items-center justify-between px-4 py-2" style={{height:68}}>
          {items.map((it, idx) => (
            <div key={it.label} className={`flex-1 text-center ${it.center? 'relative -top-6' : ''}`}>
              {it.center ? (
                <button className="bg-primary w-14 h-14 rounded-full text-white shadow-xl border-4 border-white">+</button>
              ) : (
                <Link href={it.href} className="text-sm text-slate-500">{it.label}</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
