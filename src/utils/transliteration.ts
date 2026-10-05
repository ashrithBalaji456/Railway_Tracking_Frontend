const mappings: Record<string, Record<string, string>> = {
  "Vijayawada": { hi: "विजयवाड़ा", te: "విజయవాడ", bn: "বিজয়ওয়াড়া" },
  "Vijayawada Junction": { hi: "विजयवाड़ा जंक्शन", te: "విజయవాడ జంక్షన్", bn: "বিজয়ওয়াড়া জংশন" },
  "New Delhi": { hi: "नई दिल्ली", te: "న్యూఢిల్లీ", bn: "নয়াদিল্লি" },
  "Warangal": { hi: "वारंगल", te: "వరంగల్", bn: "ওয়ারাঙ্গল" },
  "Secunderabad Jn": { hi: "सिकंदराबाद जं", te: "సికింద్రాబాద్ జంక్షన్", bn: "সেকেন্দ্রাবাদ জং" },
  "Hyderabad": { hi: "हैदराबाद", te: "హైదరాబాద్", bn: "হায়দ্রাবাদ" },
  
  "Charminar Express": { hi: "चारमीनार एक्सप्रेस", te: "చార్మినార్ ఎక్స్‌ప్రెస్", bn: "চারমিনার এক্সপ্রেস" },
  "Charminar": { hi: "चारमीनार", te: "చార్మినార్", bn: "চারমিনার" },
  "Kerala Express": { hi: "केरल एक्सप्रेस", te: "కేరళ ఎక్స్‌ప్రెస్", bn: "কেরল এক্সপ্রেস" },
  "Telangana Express": { hi: "तेलंगाना एक्सप्रेस", te: "తెలంగాణ ఎక్స్‌ప్రెస్", bn: "তেলেঙ্গানা এক্সপ্রেস" },
  "Gautami Express": { hi: "गौतमी एक्सप्रेस", te: "గౌతమి ఎక్స్‌ప్రెస్", bn: "গৌতমি এক্সপ্রেস" }
};

export function translateName(name: string, lang: string): string {
  if (!name) return "";
  if (mappings[name] && mappings[name][lang]) {
    return mappings[name][lang];
  }
  // Substring match replacements
  for (const key of Object.keys(mappings)) {
    if (name.includes(key) && mappings[key][lang]) {
      return name.replace(key, mappings[key][lang]);
    }
  }
  return name;
}
