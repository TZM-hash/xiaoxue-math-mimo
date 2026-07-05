(function () {
  "use strict";

  const curriculumProfile = {
    id: "hangzhou-pep-primary-english",
    region: "浙江省杭州市",
    textbook: "小学英语（三年级起点 PEP 人教版）",
    publisher: "人民教育出版社",
    sourceNote: "按杭州小学常用人教 PEP 三年级起点 3-6 年级单元能力线组织，题目使用原创情境材料。",
    rolloutNote: "先覆盖 3-6 年级可自动判分题型，1-2 年级保留后续英语启蒙扩展入口。"
  };

  const sourceLabels = {
    inTextbook: "课内教材",
    abilityLine: "能力线"
  };

  const grades = {
    3: {
      focus: ["字母与自然拼读", "校园和家庭词汇", "基础问候句型", "短对话阅读"],
      terms: [
        {
          name: "三年级上册",
          units: [
            { title: "Unit 1 Hello", knowledge: { words: ["hello", "hi", "Miss", "Mr"], patterns: ["Hello, I'm ...", "What's your name?"], phonics: ["Aa", "Bb", "Cc"] } },
            { title: "Unit 2 Colours", knowledge: { words: ["red", "yellow", "green", "blue"], patterns: ["I see ...", "Show me ..."], phonics: ["Dd", "Ee", "Ff"] } },
            { title: "Unit 3 Look at me", knowledge: { words: ["face", "ear", "eye", "nose", "mouth"], patterns: ["Look at me.", "This is ..."], phonics: ["Gg", "Hh", "Ii"] } },
            { title: "Unit 4 We love animals", knowledge: { words: ["cat", "dog", "duck", "pig", "bear"], patterns: ["What's this?", "It's a ..."], phonics: ["Jj", "Kk", "Ll"] } },
            { title: "Unit 5 Let's eat", knowledge: { words: ["bread", "egg", "milk", "juice"], patterns: ["I'd like ...", "Have some ..."], phonics: ["Mm", "Nn", "Oo"] } },
            { title: "Unit 6 Happy birthday", knowledge: { words: ["one", "two", "three", "four", "five"], patterns: ["How old are you?", "I'm ... years old."], phonics: ["Pp", "Qq", "Rr"] } }
          ]
        },
        {
          name: "三年级下册",
          units: [
            { title: "Unit 1 Welcome back to school", knowledge: { words: ["teacher", "student", "pupil", "school"], patterns: ["Where are you from?", "I'm from ..."], phonics: ["short a"] } },
            { title: "Unit 2 My family", knowledge: { words: ["father", "mother", "brother", "sister"], patterns: ["Who's that man?", "He's my ..."], phonics: ["short e"] } },
            { title: "Unit 3 At the zoo", knowledge: { words: ["tall", "short", "fat", "thin"], patterns: ["It's so ...", "Look at that ..."], phonics: ["short i"] } },
            { title: "Unit 4 Where is my car", knowledge: { words: ["desk", "chair", "box", "under", "in"], patterns: ["Where is ...?", "It's in/on/under ..."], phonics: ["short o"] } },
            { title: "Unit 5 Do you like pears", knowledge: { words: ["pear", "apple", "orange", "banana"], patterns: ["Do you like ...?", "Yes, I do."], phonics: ["short u"] } },
            { title: "Unit 6 How many", knowledge: { words: ["eleven", "twelve", "thirteen", "fourteen"], patterns: ["How many ... do you see?", "I see ..."], phonics: ["review"] } }
          ]
        }
      ]
    },
    4: {
      focus: ["教室和家庭词汇", "地点方位", "物品描述", "简单阅读"],
      terms: [
        {
          name: "四年级上册",
          units: [
            { title: "Unit 1 My classroom", knowledge: { words: ["classroom", "window", "blackboard", "light"], patterns: ["What's in the classroom?", "Let's clean ..."], phonics: ["a-e"] } },
            { title: "Unit 2 My schoolbag", knowledge: { words: ["schoolbag", "maths book", "English book", "storybook"], patterns: ["What's in your schoolbag?", "I have ..."], phonics: ["i-e"] } },
            { title: "Unit 3 My friends", knowledge: { words: ["strong", "friendly", "quiet", "hair"], patterns: ["He's/She's ...", "He/She has ..."], phonics: ["o-e"] } },
            { title: "Unit 4 My home", knowledge: { words: ["bedroom", "living room", "kitchen", "bathroom"], patterns: ["Where is she?", "Is she in ...?"], phonics: ["u-e"] } },
            { title: "Unit 5 Dinner's ready", knowledge: { words: ["beef", "chicken", "noodles", "soup"], patterns: ["What would you like?", "I'd like ..."], phonics: ["e-e"] } },
            { title: "Unit 6 Meet my family", knowledge: { words: ["parents", "uncle", "aunt", "doctor", "driver"], patterns: ["How many people are there?", "What's his job?"], phonics: ["review"] } }
          ]
        },
        {
          name: "四年级下册",
          units: [
            { title: "Unit 1 My school", knowledge: { words: ["library", "teachers' office", "first floor", "second floor"], patterns: ["Where is the library?", "It's on ..."], phonics: ["er"] } },
            { title: "Unit 2 What time is it", knowledge: { words: ["breakfast", "lunch", "dinner", "music class"], patterns: ["What time is it?", "It's time for ..."], phonics: ["ir", "ur"] } },
            { title: "Unit 3 Weather", knowledge: { words: ["cold", "cool", "warm", "hot", "rainy"], patterns: ["What's the weather like?", "It's ..."], phonics: ["ar", "al"] } },
            { title: "Unit 4 At the farm", knowledge: { words: ["tomato", "potato", "green beans", "horse", "cow"], patterns: ["Are these ...?", "Yes, they are."], phonics: ["or"] } },
            { title: "Unit 5 My clothes", knowledge: { words: ["clothes", "hat", "dress", "skirt", "pants"], patterns: ["Whose coat is this?", "It's mine."], phonics: ["le"] } },
            { title: "Unit 6 Shopping", knowledge: { words: ["sunglasses", "gloves", "scarf", "umbrella"], patterns: ["Can I help you?", "How much is it?"], phonics: ["review"] } }
          ]
        }
      ]
    },
    5: {
      focus: ["日常活动", "频率和能力表达", "现在进行时入门", "阅读信息提取"],
      terms: [
        {
          name: "五年级上册",
          units: [
            { title: "Unit 1 What's he like", knowledge: { words: ["kind", "strict", "polite", "helpful"], patterns: ["What's he like?", "He is ..."], phonics: ["y", "ee"] } },
            { title: "Unit 2 My week", knowledge: { words: ["Monday", "Tuesday", "Wednesday", "weekend"], patterns: ["What do you have on ...?", "I have ..."], phonics: ["ea"] } },
            { title: "Unit 3 What would you like", knowledge: { words: ["sandwich", "salad", "hamburger", "tea"], patterns: ["What would you like to eat?", "I'd like ..."], phonics: ["ow"] } },
            { title: "Unit 4 What can you do", knowledge: { words: ["sing", "dance", "draw cartoons", "play football"], patterns: ["What can you do?", "I can ..."], phonics: ["oo"] } },
            { title: "Unit 5 There is a big bed", knowledge: { words: ["clock", "plant", "bike", "photo"], patterns: ["There is ...", "There are ..."], phonics: ["ai", "ay"] } },
            { title: "Unit 6 In a nature park", knowledge: { words: ["forest", "river", "lake", "mountain"], patterns: ["Is there ...?", "Are there ...?"], phonics: ["ou"] } }
          ]
        },
        {
          name: "五年级下册",
          units: [
            { title: "Unit 1 My day", knowledge: { words: ["exercise", "eat breakfast", "have class", "go for a walk"], patterns: ["When do you ...?", "I usually ..."], phonics: ["cl", "pl"] } },
            { title: "Unit 2 My favourite season", knowledge: { words: ["spring", "summer", "autumn", "winter"], patterns: ["Which season do you like best?", "I like ... best."], phonics: ["br", "gr"] } },
            { title: "Unit 3 My school calendar", knowledge: { words: ["January", "February", "March", "April"], patterns: ["When is ...?", "It's in ..."], phonics: ["ch", "sh"] } },
            { title: "Unit 4 When is the art show", knowledge: { words: ["first", "second", "third", "twelfth"], patterns: ["When is ...?", "It's on ..."], phonics: ["th"] } },
            { title: "Unit 5 Whose dog is it", knowledge: { words: ["mine", "yours", "his", "hers", "theirs"], patterns: ["Whose ... is it?", "It's ..."], phonics: ["ng", "nk"] } },
            { title: "Unit 6 Work quietly", knowledge: { words: ["doing morning exercises", "eating lunch", "reading a book"], patterns: ["What are they doing?", "They are ..."], phonics: ["wh"] } }
          ]
        }
      ]
    },
    6: {
      focus: ["交通和计划", "比较级", "一般过去时", "篇章阅读"],
      terms: [
        {
          name: "六年级上册",
          units: [
            { title: "Unit 1 How can I get there", knowledge: { words: ["museum", "post office", "bookstore", "hospital"], patterns: ["Where is ...?", "How can I get there?"], phonics: ["sentence stress"] } },
            { title: "Unit 2 Ways to go to school", knowledge: { words: ["on foot", "by bus", "by plane", "slow down"], patterns: ["How do you come to school?", "I usually ..."], phonics: ["linking"] } },
            { title: "Unit 3 My weekend plan", knowledge: { words: ["visit", "film", "trip", "supermarket"], patterns: ["What are you going to do?", "I'm going to ..."], phonics: ["intonation"] } },
            { title: "Unit 4 I have a pen pal", knowledge: { words: ["studies", "puzzles", "hiking", "hobbies"], patterns: ["What are his hobbies?", "He likes ..."], phonics: ["third-person s"] } },
            { title: "Unit 5 What does he do", knowledge: { words: ["factory worker", "postman", "businessman", "scientist"], patterns: ["What does he do?", "He is a ..."], phonics: ["question stress"] } },
            { title: "Unit 6 How do you feel", knowledge: { words: ["angry", "afraid", "sad", "worried", "happy"], patterns: ["How do you feel?", "You should ..."], phonics: ["emotion tone"] } }
          ]
        },
        {
          name: "六年级下册",
          units: [
            { title: "Unit 1 How tall are you", knowledge: { words: ["younger", "older", "taller", "shorter"], patterns: ["How tall are you?", "I'm ... than ..."], phonics: ["comparative -er"] } },
            { title: "Unit 2 Last weekend", knowledge: { words: ["cleaned", "stayed", "washed", "watched"], patterns: ["What did you do?", "I ..."], phonics: ["-ed"] } },
            { title: "Unit 3 Where did you go", knowledge: { words: ["went", "camping", "rode", "hurt"], patterns: ["Where did you go?", "I went to ..."], phonics: ["past forms"] } },
            { title: "Unit 4 Then and now", knowledge: { words: ["dining hall", "grass", "gym", "ago"], patterns: ["There was/were ...", "Now there is/are ..."], phonics: ["contrast stress"] } },
            { title: "Recycle Mike's happy days", knowledge: { words: ["holiday", "photo", "story", "party"], patterns: ["review past tense", "review future plan"], phonics: ["review"] } },
            { title: "Graduation review", knowledge: { words: ["memory", "dream", "middle school", "friendship"], patterns: ["I will ...", "I want to ..."], phonics: ["review"] } }
          ]
        }
      ]
    }
  };

  window.MathCampEnglishCurriculumData = {
    curriculumProfile,
    sourceLabels,
    grades
  };
})();
