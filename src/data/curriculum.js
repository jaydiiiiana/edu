export const curriculum = {
  "Kindergarten": [
    {
      id: "k-eng", title: "Fun English", icon: "📄",
      lessons: [
        { id: 1, title: "Lecture: Letter A", type: "lecture", content: "A is for Apple! 🍎 It looks like a mountain with a bridge." },
        { id: 2, title: "Quiz 1: A is for...", type: "quiz", questions: [{ q: "What is for A?", options: ["Apple", "Ball"], a: "Apple" }] },
        { id: 3, title: "Lecture: Letter B", type: "lecture", content: "B is for Ball! ⚽ It has two big bellies." },
        { id: 4, title: "Quiz 2: B is for...", type: "quiz", questions: [{ q: "What is for B?", options: ["Cat", "Ball"], a: "Ball" }] },
        { id: 5, title: "Lecture: Letter C", type: "lecture", content: "C is for Cat! 🐱 It's an open circle." },
        { id: 6, title: "Quiz 3: C is for...", type: "quiz", questions: [{ q: "What is for C?", options: ["Cat", "Dog"], a: "Cat" }] },
        { id: 7, title: "Final Test", type: "final", questions: [{ q: "Identify A, B, C!", options: ["1, 2, 3", "Apple, Ball, Cat"], a: "Apple, Ball, Cat" }] }
      ]
    },
    {
      id: "k-math", title: "Counting Paws", icon: "÷",
      lessons: [
        { id: 101, title: "Lecture: Number 1", type: "lecture", content: "1 is a tall line! ☝️ One kitten." },
        { id: 102, title: "Quiz 1", type: "quiz", questions: [{ q: "How many cats?", options: ["1", "2"], a: "1" }] },
        { id: 103, title: "Lecture: Number 2", type: "lecture", content: "2 is a curved duck! 🦆 Two kittens." },
        { id: 104, title: "Quiz 2", type: "quiz", questions: [{ q: "1 + 1 is?", options: ["2", "3"], a: "2" }] },
        { id: 105, title: "Final Math", type: "final", questions: [{ q: "Count 1, 2, 3!", options: ["One, Two, Three", "A, B, C"], a: "One, Two, Three" }] }
      ]
    }
  ],
  "Grade 1": [
    {
      id: "g1-eng", title: "Reading Time", icon: "📖",
      lessons: [
        { id: 201, title: "Lecture: Nouns", type: "lecture", content: "Nouns are names of People, Places, or Things! 🏫" },
        { id: 202, title: "Quiz 1: Nouns", type: "quiz", questions: [{ q: "Which is a place?", options: ["School", "Run"], a: "School" }] },
        { id: 203, title: "Lecture: Verbs", type: "lecture", content: "Verbs are doing words! Like Jump, Eat, and Sleep. 💤" },
        { id: 204, title: "Quiz 2: Verbs", type: "quiz", questions: [{ q: "Which is a verb?", options: ["Jump", "Apple"], a: "Jump" }] },
        { id: 205, title: "Final Test", type: "final", questions: [{ q: "Find the noun!", options: ["Teacher", "Sing"], a: "Teacher" }] }
      ]
    },
    {
      id: "g1-sci", title: "Nature Study", icon: "🌱",
      lessons: [
        { id: 211, title: "Lecture: Plants", type: "lecture", content: "Plants need sunlight, water, and soil to grow! 🪴" },
        { id: 212, title: "Quiz 1", type: "quiz", questions: [{ q: "Plants need what?", options: ["Water", "Pizza"], a: "Water" }] },
        { id: 213, title: "Final Test", type: "final", questions: [{ q: "Sunlight is good?", options: ["Yes", "No"], a: "Yes" }] }
      ]
    }
  ],
  "Grade 2": [
    {
      id: "g2-math", title: "Adding Up", icon: "➕",
      lessons: [
        { id: 301, title: "Lecture: Double Digits", type: "lecture", content: "10 + 10 = 20. We add the tens and ones places!" },
        { id: 302, title: "Quiz 1", type: "quiz", questions: [{ q: "10 + 5?", options: ["15", "20"], a: "15" }] },
        { id: 303, title: "Final Test", type: "final", questions: [{ q: "20 + 20?", options: ["40", "50"], a: "40" }] }
      ]
    },
    {
      id: "g2-soc", title: "My Family", icon: "👨‍👩‍👧",
      lessons: [
        { id: 311, title: "Lecture: Parents", type: "lecture", content: "Parents take care of us and the home." },
        { id: 312, title: "Final Test", type: "final", questions: [{ q: "Who helps at home?", options: ["Everyone", "Nobody"], a: "Everyone" }] }
      ]
    }
  ],
  "Grade 3": [
    {
      id: "g3-eng", title: "Sentence Fun", icon: "✍️",
      lessons: [
        { id: 401, title: "Lecture: Sentences", type: "lecture", content: "Sentence starts with a CAPITAL letter and ends with a period." },
        { id: 402, title: "Quiz 1", type: "quiz", questions: [{ q: "End of sentence?", options: [".", ","], a: "." }] },
        { id: 403, title: "Final Test", type: "final", questions: [{ q: "Correct sentence?", options: ["i am here.", "I am here."], a: "I am here." }] }
      ]
    }
  ],
  "Grade 4": [
    {
      id: "g4-sci", title: "Earth", icon: "🌍",
      lessons: [
        { id: 501, title: "Lecture: Crust", type: "lecture", content: "The crust is the thin outer layer we walk on." },
        { id: 502, title: "Final Test", type: "final", questions: [{ q: "Outer layer?", options: ["Core", "Crust"], a: "Crust" }] }
      ]
    }
  ],
  "Grade 5": [
    {
      id: "g5-math", title: "Fractions", icon: "🍰",
      lessons: [
        { id: 601, title: "Lecture: Half", type: "lecture", content: "A half is 1 out of 2 parts. Like half a pizza! 🍕" },
        { id: 602, title: "Final Test", type: "final", questions: [{ q: "Half of 10?", options: ["2", "5"], a: "5" }] }
      ]
    }
  ],
  "Grade 6": [
    {
      id: "g6-sci", title: "Space", icon: "🚀",
      lessons: [
        { id: 701, title: "Lecture: Planets", type: "lecture", content: "There are 8 planets in our Solar System. Mars is Red! 🔴" },
        { id: 702, title: "Quiz 1", type: "quiz", questions: [{ q: "Red planet?", options: ["Mars", "Earth"], a: "Mars" }] },
        { id: 703, title: "Final Test", type: "final", questions: [{ q: "How many planets?", options: ["8", "10"], a: "8" }] }
      ]
    }
  ]
};
