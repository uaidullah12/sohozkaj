import Link from 'next/link'

export default function Header(){
  return (
    <header className="fixed top-0 left-0 right-0 bg-white header-shadow z-30" style={{height:72}}>
      <div className="max-w-3xl mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold">স</div>
          <div>
            <div className="font-bold">সহজ কাজ</div>
            <div className="text-xs text-slate-500">WWW.SOHOZKAJ.COM</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button aria-label="search" className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
            🔍
          </button>
          <div className="w-10 h-10 bg-primary rounded-full text-white flex items-center justify-center">আ</div>
        </div>
      </div>
    </header>
  )
}
