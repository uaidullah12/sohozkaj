export default function UploadBox({title='ছবি আপলোড করুন'}:{title?:string}){
  return (
    <div className="bg-white rounded-xl p-4 text-center border-dashed border-2 border-gray-200">
      <div className="text-slate-400 mb-2">🖼️</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-slate-500 mt-2">টেনে আনুন অথবা চাপুন · JPG, PNG · সর্বোচ্চ 60MB</div>
      <button className="mt-3 bg-primary text-white px-4 py-2 rounded-md">ছবি আপলোড করুন</button>
    </div>
  )
}
