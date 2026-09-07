import Link from 'next/link'

export default function ServiceCard({title, href, gradient}:{title:string, href:string, gradient?:string}){
  return (
    <Link href={href} className="block bg-white rounded-xl p-3 text-center shadow-sm">
      <div className={`w-20 h-20 mx-auto rounded-2xl mb-3 bg-gradient-to-br ${gradient || 'from-gray-300 to-slate-400'} flex items-center justify-center text-white text-lg font-bold`}>
        {title.split(' ')[0]}
      </div>
      <div className="text-sm font-semibold">{title}</div>
    </Link>
  )
}
