import React from 'react';
import { Lightbulb, BookHeart, Clock } from 'lucide-react';

export default function Tips() {
  const tips = [
    {
      id: 1,
      title: "Waktu Bagaikan Pedang",
      content: "Jika kamu tidak memotongnya, maka ia yang akan memotongmu. Jangan biarkan waktu berlalu tanpa memberikan manfaat, baik untuk dunia maupun akhiratmu.",
      icon: Clock,
      color: "bg-blue-50 text-blue-600"
    },
    {
      id: 2,
      title: "Salat di Awal Waktu",
      content: "Rasulullah ﷺ bersabda ketika ditanya amalan apa yang paling dicintai Allah: 'Salat pada waktunya.' (HR. Bukhari & Muslim). Sebisa mungkin jadikan salat sebagai jeda istirahat dari tugas.",
      icon: BookHeart,
      color: "bg-green-50 text-green-600"
    },
    {
      id: 3,
      title: "Manfaatkan 5 Sebelum 5",
      content: "Manfaatkan masa mudamu sebelum datang masa tuamu, sehatmu sebelum sakitmu, kayamu sebelum miskinmu, waktu luangmu sebelum sibukmu, dan hidupmu sebelum matimu. (HR. Al-Hakim)",
      icon: Lightbulb,
      color: "bg-amber-50 text-amber-600"
    },
    {
      id: 4,
      title: "Kerjakan yang Sedikit tapi Konsisten",
      content: "Amalan yang paling dicintai oleh Allah adalah amalan yang kontinu walaupun itu sedikit. (HR. Muslim). Mulailah dari target kecil yang bisa kamu lakukan setiap hari tanpa terlewat.",
      icon: BookHeart,
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-bold text-text-main">Tips Islami</h1>
        <p className="text-text-muted text-sm mt-1">Panduan singkat menjaga waktu dan ibadah</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tips.map(tip => (
          <div key={tip.id} className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tip.color}`}>
              <tip.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
            <p className="text-text-muted leading-relaxed text-sm">{tip.content}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
