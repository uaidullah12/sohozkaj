import Link from 'next/link'
import ServiceCard from '../components/ServiceCard'

export default function Home(){
  const services = [
    {title: 'AI ফটো এডিট', href: '/generate-ai', color: 'from-purple-600 to-indigo-500'},
    {title: 'ম্যানুয়াল ফটো এডিট', href: '/manual-editor', color: 'from-blue-500 to-sky-400'},
    {title: 'ব্যাক ফটো এডিট', href: '/tools/background-remover', color: 'from-green-400 to-emerald-500'},
    {title: 'ডকুমেন্ট তৈরি', href: '/documents/create', color: 'from-pink-500 to-violet-500'},
    {title: 'চাকরির বিজ্ঞপ্তি', href: '/jobs', color: 'from-orange-400 to-amber-500'},
    {title: 'সহজটুলস', href: '/tools', color: 'from-rose-400 to-pink-500'}
  ]

  return (
    <section className="pt-6">
      <h1 className="text-2xl font-bold mb-4">সার্ভিসসমূহ</h1>
      <div className="grid grid-cols-3 gap-3">
        {services.map(s => (
          <ServiceCard key={s.title} title={s.title} href={s.href} gradient={s.color} />
        ))}
      </div>

      <hr className="my-6" />

      <h2 className="text-lg font-semibold mb-3">অতিরিক্ত টুলস</h2>
      <div className="grid grid-cols-5 gap-3">
        {['ফর্ম ফটো ফিলআপ','ইমেজ কমপ্রেস','ইমেজ কনভার্ট','পিডিএফ এডিট','ছবি থেকে লেখা','ডকুমেন্ট স্ক্যানার'].map(t => (
          <div key={t} className="bg-white rounded-xl p-3 text-center text-sm shadow-sm">{t}</div>
        ))}
      </div>

      <section className="mt-6">
        <h3 className="text-lg font-semibold mb-3">হিসাব ও সেটিংস</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">ওয়ালেট</div>
          <div className="bg-white rounded-xl p-4 shadow-sm">সাবস্ক্রিপশন</div>
          <div className="bg-white rounded-xl p-4 shadow-sm">ইউজেজ</div>
          <div className="bg-white rounded-xl p-4 shadow-sm">হেল্প</div>
        </div>
      </section>
    </section>
  )
}
