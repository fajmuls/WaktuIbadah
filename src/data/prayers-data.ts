export interface PrayerItem {
  id: string;
  category: 'wirid_salat' | 'harian' | 'belajar';
  title: string;
  subTitle?: string;
  arabic: string;
  latin: string;
  translation: string;
  targetCount?: number;
  notes?: string;
}

export const WIRID_SESUDAH_SALAT: PrayerItem[] = [
  {
    id: 'wirid-1',
    category: 'wirid_salat',
    title: '1. Istighfar',
    subTitle: 'Dibaca 3 kali setelah salam',
    arabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيْمَ الَّذِيْ لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّوْمَ وَأَتُوْبُ إِلَيْهِ',
    latin: "Astaghfirullahal 'adziim, alladzii laa ilaaha illaa huwal hayyul qayyuumu wa atuubu ilaih.",
    translation: 'Aku memohon ampunan kepada Allah Yang Maha Agung, tiada Tuhan selain Dia Yang Maha Hidup lagi Berdiri Sendiri, dan aku bertobat kepada-Nya.',
    targetCount: 3,
    notes: 'Sunnah dibaca 3x'
  },
  {
    id: 'wirid-2',
    category: 'wirid_salat',
    title: '2. Tahlil & Pengakuan Kekuasaan Allah',
    subTitle: 'Dibaca 3 kali (atau 10x setelah Subuh & Magrib)',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِيْ وَيُمِيْتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرٌ',
    latin: "Laa ilaaha illallaahu wahdahuu laa syariikalah, lahul mulku wa lahul hamdu yuhyii wa yumiitu wa huwa 'alaa kulli syai'in qadiir.",
    translation: 'Tiada Tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya segala kerajaan dan bagi-Nya segala puji, Dialah Yang menghidupkan dan mematikan, dan Dia Maha Kuasa atas segala sesuatu.',
    targetCount: 3,
    notes: 'Dibaca 3x'
  },
  {
    id: 'wirid-3',
    category: 'wirid_salat',
    title: '3. Doa Keselamatan (As-Salam)',
    subTitle: 'Memohon perlindungan dan kedamaian',
    arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    latin: "Allaahumma antas salaam wa minkas salaam tabaarakta yaa dzal jalaali wal ikraam.",
    translation: 'Ya Allah, Engkaulah As-Salam (Yang Maha Menyelamatkan), dari-Mu keselamatan, Mahasuci Engkau wahai Rabb Yang Memiliki Keagungan dan Kemuliaan.',
    targetCount: 1,
  },
  {
    id: 'wirid-4',
    category: 'wirid_salat',
    title: '4. Doa Kepatuhan & Karunia',
    subTitle: 'Pujian atas ketetapan Allah',
    arabic: 'اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    latin: "Allaahumma laa maani'a limaa a'thaita, wa laa mu'thiya limaa mana'ta, wa laa yanfa'u dzal jaddi minkal jaddu.",
    translation: 'Ya Allah, tidak ada yang dapat menghalangi apa yang Engkau berikan, dan tidak ada yang dapat memberi apa yang Engkau halangi, dan tidak berguna kekayaan bagi orang yang memilikinya dari siksa-Mu.',
    targetCount: 1,
  },
  {
    id: 'wirid-5',
    category: 'wirid_salat',
    title: '5. Ayat Kursi (QS. Al-Baqarah: 255)',
    subTitle: 'Pelindung utama setelah salat fardhu',
    arabic: 'اللهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّوْمُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِيْ يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيْهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيْطُوْنَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُوْدُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيْمُ',
    latin: "Allaahu laa ilaaha illaa huwal hayyul qayyuum, laa ta'khudzuhuu sinatuw wa laa naum, lahuu maa fis samaawaati wa maa fil ardh, man dzalladzii yasyfa'u 'indahuu illaa bi idznih, ya'lamu maa baina aidiihim wa maa khalfahum, wa laa yuhiithuuna bisyai'im min 'ilmihii illaa bimaa syaa', wasi'a kursiyyuhus samaawaati wal ardh, wa laa ya'uuduhuu hifzhuhumaa, wa huwal 'aliyyul 'azhiim.",
    translation: 'Allah, tidak ada tuhan selain Dia, Yang Mahahidup, Yang terus-menerus mengurus (makhluk-Nya), tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Mahatinggi, Mahabesar.',
    targetCount: 1,
  },
  {
    id: 'wirid-6',
    category: 'wirid_salat',
    title: '6. Tasbih (Maha Suci Allah)',
    subTitle: 'Dibaca 33 kali',
    arabic: 'سُبْحَانَ اللهِ',
    latin: 'Subhanallah.',
    translation: 'Maha Suci Allah.',
    targetCount: 33,
  },
  {
    id: 'wirid-7',
    category: 'wirid_salat',
    title: '7. Tahmid (Segala Puji Bagi Allah)',
    subTitle: 'Dibaca 33 kali',
    arabic: 'الْحَمْدُ للهِ',
    latin: 'Alhamdulillah.',
    translation: 'Segala puji bagi Allah.',
    targetCount: 33,
  },
  {
    id: 'wirid-8',
    category: 'wirid_salat',
    title: '8. Takbir (Allah Maha Besar)',
    subTitle: 'Dibaca 33 kali',
    arabic: 'اللهُ أَكْبَرُ',
    latin: 'Allahu Akbar.',
    translation: 'Allah Maha Besar.',
    targetCount: 33,
  },
  {
    id: 'wirid-9',
    category: 'wirid_salat',
    title: '9. Penggenap Seratus (Tahlil Sempurna)',
    subTitle: 'Penggenap 100 zikir tasbih, tahmid, takbir',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِيْ وَيُمِيْتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرٌ',
    latin: "Laa ilaaha illallaahu wahdahuu laa syariikalah, lahul mulku wa lahul hamdu yuhyii wa yumiitu wa huwa 'alaa kulli syai'in qadiir.",
    translation: 'Tiada Tuhan selain Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segala kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.',
    targetCount: 1,
  },
  {
    id: 'wirid-10',
    category: 'wirid_salat',
    title: '10. Doa Lengkap Setelah Salat Fardhu',
    subTitle: 'Doa memohon keselamatan agama, ilmu, rezeki & kebaikan akhirat',
    arabic: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِيْنَ، حَمْدًا يُوَافِي نِعَمَهُ وَيُكَافِئُ مَزِيْدَهُ. يَا رَبَّنَا لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ وَعَظِيْمِ سُلْطَانِكَ. اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ. اللَّهُمَّ إِنَّا نَسْأَلُكَ سَلَامَةً فِي الدِّيْنِ، وَعَافِيَةً فِي الْجَسَدِ، وَزِيَادَةً فِي الْعِلْمِ، وَبَرَكَةً فِي الرِّزْقِ، وَتَوْبَةً قَبْلَ الْمَوْتِ، وَرَحْمَةً عِنْدَ الْمَوْتِ، وَمَغْفِرَةً بَعْدَ الْمَوْتِ. اللَّهُمَّ هَوِّنْ عَلَيْنَا فِي سَكَرَاتِ الْمَوْتِ، وَالنَّجَاةَ مِنَ النَّارِ، وَالْعَفْوَ عِنْدَ الْحِسَابِ. رَبَّنَا لَا تُزِغْ قُلُوْبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ. رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ. وَصَلَّى اللهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلَّمَ، وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِيْنَ.',
    latin: "Bismillaahir rahmaanir rahiim. Alhamdulillaahi rabbil 'aalamiin, hamday yuwaafii ni'amahuu wa yukaafi'u maziidah. Yaa rabbanaa lakal hamdu kamaa yambaghii lijalaali wajhika wa 'azhiimi sulthaanik. Allaahumma shalli 'alaa sayyidinaa Muhammadin wa 'alaa aali sayyidinaa Muhammad. Allaahumma innaa nas'aluka salaamatan fid diin, wa 'aafiyatan fil jasad, wa ziyaadatan fil 'ilmi, wa barakatan fir rizqi, wa taubatan qablal maut, wa rahmatan 'indal maut, wa maghfiratam ba'dal maut. Allaahumma hawwin 'alainaa fii sakaraatil maut, wan najaata minan naar, wal 'afwa 'indal hisaab. Rabbanaa laa tuzigh quluubanaa ba'da idz hadaitanaa wa hab lanaa mil ladunka rahmah, innaka antal wahhaab. Rabbanaa aatinaa fid dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban naar. Wa shallallaahu 'alaa sayyidinaa Muhammadin wa 'alaa aalihii wa shahbihii wa sallam, walhamdu lillaahi rabbil 'aalamiin.",
    translation: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang. Segala puji bagi Allah Tuhan semesta alam, pujian yang sebanding dengan nikmat-nikmat-Nya dan menjamin tambahannya. Wahai Tuhan kami, bagi-Mu segala puji sebagaimana yang layak bagi keagungan Zat-Mu dan kebesaran kekuasaan-Mu. Ya Allah limpahkanlah shalawat dan salam atas junjungan kami Nabi Muhammad beserta keluarganya. Ya Allah, kami memohon kepada-Mu keselamatan dalam agama, kesehatan jasmani, bertambahnya ilmu, keberkahan rezeki, taubat sebelum mati, rahmat ketika mati, dan ampunan setelah mati. Ya Allah, mudahkanlah bagi kami saat sakaratul maut, selamatkanlah dari api neraka, dan berikanlah ampunan saat hisab. Wahai Tuhan kami, janganlah Engkau jadikan hati kami condong kepada kesesatan setelah Engkau beri petunjuk kepada kami, dan karuniakanlah kepada kami rahmat dari sisi-Mu; sesungguhnya Engkau-lah Maha Pemberi. Wahai Tuhan kami, berikanlah kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari siksa neraka. Dan semoga Allah melimpahkan rahmat dan kesejahteraan kepada junjungan kami Nabi Muhammad beserta keluarga dan para sahabatnya. Segala puji bagi Allah Tuhan semesta alam.',
    targetCount: 1,
  }
];

export const DOA_HARIAN: PrayerItem[] = [
  {
    id: 'doa-makan-1',
    category: 'harian',
    title: 'Doa Sebelum Makan',
    subTitle: 'Memohon keberkahan pada rezeki makanan',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ، بِسْمِ اللَّهِ',
    latin: "Allaahumma baarik lanaa fiimaa razaqtanaa wa qinaa 'adzaaban naar, bismillaah.",
    translation: 'Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka. Dengan nama Allah.',
  },
  {
    id: 'doa-makan-2',
    category: 'harian',
    title: 'Doa Sesudah Makan',
    subTitle: 'Syukur atas rezeki makanan dan minuman',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    latin: "Alhamdulillaahil ladzii ath'amanaa wa saqaanaa wa ja'alanaa muslimiin.",
    translation: 'Segala puji bagi Allah yang telah memberi makan dan minum kepada kami, serta menjadikan kami orang-orang muslim.',
  },
  {
    id: 'doa-tidur-1',
    category: 'harian',
    title: 'Doa Sebelum Tidur',
    subTitle: 'Menyerahkan jiwa raga sebelum terlelap',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ',
    latin: 'Bismikallaahumma ahyaa wa amuut.',
    translation: 'Dengan nama-Mu ya Allah, aku hidup dan aku mati.',
  },
  {
    id: 'doa-tidur-2',
    category: 'harian',
    title: 'Doa Bangun Tidur',
    subTitle: 'Pujian atas kesadaran dan kebangkitan',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    latin: "Alhamdulillaahil ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur.",
    translation: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami (tidur), dan hanya kepada-Nya tempat kembali.',
  },
  {
    id: 'doa-rumah-1',
    category: 'harian',
    title: 'Doa Keluar Rumah',
    subTitle: 'Perlindungan dari marabahaya di luar rumah',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: "Bismillaahi tawakkaltu 'alallaahi, laa haula wa laa quwwata illaa billaah.",
    translation: 'Dengan nama Allah, aku bertawakal kepada Allah. Tiada daya dan kekuatan melainkan dengan pertolongan Allah.',
  },
  {
    id: 'doa-kendaraan-1',
    category: 'harian',
    title: 'Doa Naik Kendaraan & Bepergian',
    subTitle: 'Perlindungan dalam perjalanan',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    latin: "Subhaanalladzii sakhkhara lanaa haadzaa wa maa kunnaa lahuu muqriniin, wa innaa ilaa rabbinaa lamunqalibuun.",
    translation: 'Maha Suci Tuhan yang telah menundukkan semua ini bagi kami padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Tuhan kami.',
  },
  {
    id: 'doa-masjid-1',
    category: 'harian',
    title: 'Doa Masuk Masjid',
    subTitle: 'Memohon dibukakannya pintu rahmat',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    latin: 'Allaahummaftah lii abwaaba rahmatik.',
    translation: 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.',
  },
  {
    id: 'doa-masjid-2',
    category: 'harian',
    title: 'Doa Keluar Masjid',
    subTitle: 'Memohon karunia dan kebaikan',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    latin: "Allaahumma innii as'aluka min fadhlik.",
    translation: 'Ya Allah, sesungguhnya aku memohon karunia-Mu.',
  }
];

export const DOA_BELAJAR: PrayerItem[] = [
  {
    id: 'doa-belajar-1',
    category: 'belajar',
    title: 'Doa Sebelum Belajar & Kuliah',
    subTitle: 'Memohon tambahan ilmu dan kemudahan pemahaman',
    arabic: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا وَاجْعَلْنِي مِنَ الصَّالِحِينَ',
    latin: "Rabbi zidnii 'ilman warzuqnii fahman waj'alnii minash shaalihiin.",
    translation: 'Ya Tuhanku, tambahkanlah ilmuku, dan berilah aku pemahaman yang baik, serta jadikanlah aku termasuk golongan orang-orang yang saleh.',
  },
  {
    id: 'doa-belajar-2',
    category: 'belajar',
    title: 'Doa Kelancaran Berbicara & Menghadapi Ujian',
    subTitle: 'Doa Nabi Musa AS untuk kelapangan dada',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي',
    latin: "Rabbisyrah lii shadrii wa yassir lii amrii wahlul 'uqdatam mil lisaanii yafqahuu qaulii.",
    translation: 'Ya Tuhanku, lapangkanlah dadaku, mudahkanlah urusanku, dan lepaskanlah kekakuan dari lidahku, agar mereka mengerti perkataanku.',
  },
  {
    id: 'doa-belajar-3',
    category: 'belajar',
    title: 'Doa Menghadapi Tugas Berat & Kesulitan',
    subTitle: 'Memohon kemudahan dari Allah SWT',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    latin: "Allaahumma laa sahla illaa maa ja'altahuu sahlan, wa anta taj'alul hazna idzaa syi'ta sahlan.",
    translation: 'Ya Allah, tidak ada kemudahan melainkan apa yang Engkau jadikan mudah, dan Engkau menjadikan kesulitan jika Engkau kehendaki menjadi mudah.',
  }
];

export const ALL_DOA_ITEMS: PrayerItem[] = [
  ...WIRID_SESUDAH_SALAT,
  ...DOA_HARIAN,
  ...DOA_BELAJAR
];
