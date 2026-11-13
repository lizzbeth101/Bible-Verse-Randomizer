import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, CheckCheck,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy, Dices, Download,
  FileUp, Heart, Highlighter, Info, Library, ListChecks, LockKeyhole, Moon,
  NotebookPen, RotateCcw, Search, Settings2, Shuffle, Sparkles, Sun, Target,
  Trash2, X,
} from 'lucide-react';

type Theme = 'light' | 'sepia' | 'dark';
type View = 'home' | 'reader' | 'roulette' | 'topics' | 'today' | 'mood' | 'memorize' | 'tracker' | 'saved' | 'plan' | 'how' | 'about' | 'privacy' | 'contact';
type Verse = { text: string; ref: string; category: string };
type BibleBook = { name: string; testament: 'Old Testament' | 'New Testament'; chapterCount: number; author: string; about: string };
type ReadingProgress = { readChapterKeys: string[]; streak: number; dailyGoal: number; readingHistory: { key: string; ts: number }[] };
type SavedVerse = Verse & { color: string };
type Note = { id: string; ref: string; text: string; date: string };
type Highlight = { ref: string; color: string };
type Preferences = { theme: Theme; fontSize: number; fontFamily: 'serif' | 'sans' };
type Store = { preferences: Preferences; progress: ReadingProgress; saved: SavedVerse[]; notes: Note[]; highlights: Highlight[]; bookmarks: string[]; planDone: number[]; game: { points: number; rounds: number; verseRef: string } };

const BOOKS: BibleBook[] = [
  {name:'Genesis',testament:'Old Testament',chapterCount:50,author:'Moses',about:'Beginnings — creation, covenant, and promise.'},
  {name:'Exodus',testament:'Old Testament',chapterCount:40,author:'Moses',about:'Freedom from Egypt and the covenant at Sinai.'},
  {name:'Leviticus',testament:'Old Testament',chapterCount:27,author:'Moses',about:'Holiness, worship, and life with God.'},
  {name:'Numbers',testament:'Old Testament',chapterCount:36,author:'Moses',about:'Wilderness journey and faithful guidance.'},
  {name:'Deuteronomy',testament:'Old Testament',chapterCount:34,author:'Moses',about:'A second telling of the Law before entering the land.'},
  {name:'Joshua',testament:'Old Testament',chapterCount:24,author:'Joshua',about:'Courage and entering the promised land.'},
  {name:'Judges',testament:'Old Testament',chapterCount:21,author:'Samuel',about:'Cycles of rescue and the need for a King.'},
  {name:'Ruth',testament:'Old Testament',chapterCount:4,author:'Samuel',about:'Loyalty, kindness, and redemption.'},
  {name:'1 Samuel',testament:'Old Testament',chapterCount:31,author:'Samuel',about:'Kings, calling, and a heart after God.'},
  {name:'2 Samuel',testament:'Old Testament',chapterCount:24,author:'Nathan / Gad',about:'David’s reign, failure, and grace.'},
  {name:'1 Kings',testament:'Old Testament',chapterCount:22,author:'Jeremiah',about:'Solomon, division, and prophets.'},
  {name:'2 Kings',testament:'Old Testament',chapterCount:25,author:'Jeremiah',about:'Exile and God’s persistent faithfulness.'},
  {name:'1 Chronicles',testament:'Old Testament',chapterCount:29,author:'Ezra',about:'David’s line and worship restored.'},
  {name:'2 Chronicles',testament:'Old Testament',chapterCount:36,author:'Ezra',about:'Kings and the temple.'},
  {name:'Ezra',testament:'Old Testament',chapterCount:10,author:'Ezra',about:'Return, rebuilding, and renewal.'},
  {name:'Nehemiah',testament:'Old Testament',chapterCount:13,author:'Nehemiah',about:'Rebuilding walls and hearts.'},
  {name:'Esther',testament:'Old Testament',chapterCount:10,author:'Mordecai',about:'Courage for such a time as this.'},
  {name:'Job',testament:'Old Testament',chapterCount:42,author:'Job / Elihu',about:'Suffering, mystery, and trust.'},
  {name:'Psalms',testament:'Old Testament',chapterCount:150,author:'David & others',about:'Songs for every human season.'},
  {name:'Proverbs',testament:'Old Testament',chapterCount:31,author:'Solomon',about:'Everyday wisdom for life.'},
  {name:'Ecclesiastes',testament:'Old Testament',chapterCount:12,author:'Solomon',about:'Meaning beyond what fades.'},
  {name:'Song of Solomon',testament:'Old Testament',chapterCount:8,author:'Solomon',about:'Love, longing, and delight.'},
  {name:'Isaiah',testament:'Old Testament',chapterCount:66,author:'Isaiah',about:'Judgment and astonishing comfort.'},
  {name:'Jeremiah',testament:'Old Testament',chapterCount:52,author:'Jeremiah',about:'A prophet who wept and hoped.'},
  {name:'Lamentations',testament:'Old Testament',chapterCount:5,author:'Jeremiah',about:'Grief held honestly before God.'},
  {name:'Ezekiel',testament:'Old Testament',chapterCount:48,author:'Ezekiel',about:'Dry bones and new life.'},
  {name:'Daniel',testament:'Old Testament',chapterCount:12,author:'Daniel',about:'Faithfulness in exile.'},
  {name:'Hosea',testament:'Old Testament',chapterCount:14,author:'Hosea',about:'Relentless, redeeming love.'},
  {name:'Joel',testament:'Old Testament',chapterCount:3,author:'Joel',about:'The Spirit poured out.'},
  {name:'Amos',testament:'Old Testament',chapterCount:9,author:'Amos',about:'Let justice roll like a river.'},
  {name:'Obadiah',testament:'Old Testament',chapterCount:1,author:'Obadiah',about:'Pride humbled; God reigns.'},
  {name:'Jonah',testament:'Old Testament',chapterCount:4,author:'Jonah',about:'Mercy wider than we expect.'},
  {name:'Micah',testament:'Old Testament',chapterCount:7,author:'Micah',about:'Act justly, love mercy, walk humbly.'},
  {name:'Nahum',testament:'Old Testament',chapterCount:3,author:'Nahum',about:'God defends the oppressed.'},
  {name:'Habakkuk',testament:'Old Testament',chapterCount:3,author:'Habakkuk',about:'Trust when answers are slow.'},
  {name:'Zephaniah',testament:'Old Testament',chapterCount:3,author:'Zephaniah',about:'The Lord rejoices over you.'},
  {name:'Haggai',testament:'Old Testament',chapterCount:2,author:'Haggai',about:'Rebuild with God’s presence.'},
  {name:'Zechariah',testament:'Old Testament',chapterCount:14,author:'Zechariah',about:'Visions of restoration.'},
  {name:'Malachi',testament:'Old Testament',chapterCount:4,author:'Malachi',about:'Return to the Lord.'},
  {name:'Matthew',testament:'New Testament',chapterCount:28,author:'Matthew',about:'Jesus, the promised King.'},
  {name:'Mark',testament:'New Testament',chapterCount:16,author:'Mark',about:'Jesus, the servant who acts.'},
  {name:'Luke',testament:'New Testament',chapterCount:24,author:'Luke',about:'Jesus, friend of the overlooked.'},
  {name:'John',testament:'New Testament',chapterCount:21,author:'John',about:'Believe — and have life.'},
  {name:'Acts',testament:'New Testament',chapterCount:28,author:'Luke',about:'The Spirit sends the church out.'},
  {name:'Romans',testament:'New Testament',chapterCount:16,author:'Paul',about:'Grace, faith, and new life.'},
  {name:'1 Corinthians',testament:'New Testament',chapterCount:16,author:'Paul',about:'Love in a divided church.'},
  {name:'2 Corinthians',testament:'New Testament',chapterCount:13,author:'Paul',about:'Strength in weakness.'},
  {name:'Galatians',testament:'New Testament',chapterCount:6,author:'Paul',about:'Freedom in Christ.'},
  {name:'Ephesians',testament:'New Testament',chapterCount:6,author:'Paul',about:'One new people in Christ.'},
  {name:'Philippians',testament:'New Testament',chapterCount:4,author:'Paul',about:'Joy even in chains.'},
  {name:'Colossians',testament:'New Testament',chapterCount:3,author:'Paul',about:'Christ is all.'},
  {name:'1 Thessalonians',testament:'New Testament',chapterCount:5,author:'Paul',about:'Hope for Christ’s return.'},
  {name:'2 Thessalonians',testament:'New Testament',chapterCount:3,author:'Paul',about:'Stand firm.'},
  {name:'1 Timothy',testament:'New Testament',chapterCount:6,author:'Paul',about:'Healthy teaching, healthy church.'},
  {name:'2 Timothy',testament:'New Testament',chapterCount:4,author:'Paul',about:'Finish the race well.'},
  {name:'Titus',testament:'New Testament',chapterCount:3,author:'Paul',about:'Grace that trains us.'},
  {name:'Philemon',testament:'New Testament',chapterCount:1,author:'Paul',about:'Forgiveness and brotherhood.'},
  {name:'Hebrews',testament:'New Testament',chapterCount:13,author:'Unknown',about:'Jesus is better.'},
  {name:'James',testament:'New Testament',chapterCount:5,author:'James',about:'Faith that works.'},
  {name:'1 Peter',testament:'New Testament',chapterCount:5,author:'Peter',about:'Hope in suffering.'},
  {name:'2 Peter',testament:'New Testament',chapterCount:3,author:'Peter',about:'Grow in grace.'},
  {name:'1 John',testament:'New Testament',chapterCount:5,author:'John',about:'God is love.'},
  {name:'2 John',testament:'New Testament',chapterCount:1,author:'John',about:'Walk in truth and love.'},
  {name:'3 John',testament:'New Testament',chapterCount:1,author:'John',about:'Hospitality and truth.'},
  {name:'Jude',testament:'New Testament',chapterCount:1,author:'Jude',about:'Contend for the faith.'},
  {name:'Revelation',testament:'New Testament',chapterCount:22,author:'John',about:'The Lamb wins; all is made new.'},
];

const VERSES: Verse[] = [
  {text:'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',ref:'John 3:16',category:'Love'},
  {text:'The Lord is my shepherd, I lack nothing.',ref:'Psalm 23:1',category:'Comfort'},
  {text:'I can do all this through him who gives me strength.',ref:'Philippians 4:13',category:'Strength'},
  {text:'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',ref:'Jeremiah 29:11',category:'Hope'},
  {text:'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',ref:'Proverbs 3:5–6',category:'Guidance'},
  {text:'Be still, and know that I am God.',ref:'Psalm 46:10',category:'Peace'},
  {text:'And we know that in all things God works for the good of those who love him.',ref:'Romans 8:28',category:'Hope'},
  {text:'Do not fear, for I am with you; do not be dismayed, for I am your God.',ref:'Isaiah 41:10',category:'Courage'},
  {text:'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',ref:'1 Corinthians 13:4',category:'Love'},
  {text:'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',ref:'Psalm 34:18',category:'Comfort'},
  {text:'Cast all your anxiety on him because he cares for you.',ref:'1 Peter 5:7',category:'Peace'},
  {text:'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.',ref:'Isaiah 40:31',category:'Strength'},
  {text:'Your word is a lamp for my feet, a light on my path.',ref:'Psalm 119:105',category:'Guidance'},
  {text:'Come to me, all you who are weary and burdened, and I will give you rest.',ref:'Matthew 11:28',category:'Rest'},
  {text:'Peace I leave with you; my peace I give you.',ref:'John 14:27',category:'Peace'},
  {text:'Rejoice in the Lord always. I will say it again: Rejoice!',ref:'Philippians 4:4',category:'Joy'},
  {text:'Let all that you do be done in love.',ref:'1 Corinthians 16:14',category:'Love'},
  {text:'The Lord bless you and keep you; the Lord make his face shine on you.',ref:'Numbers 6:24–25',category:'Blessing'},
  {text:'Create in me a pure heart, O God, and renew a steadfast spirit within me.',ref:'Psalm 51:10',category:'Renewal'},
  {text:'I have hidden your word in my heart that I might not sin against you.',ref:'Psalm 119:11',category:'Memory'},
  {text:'For God has not given us a spirit of fear, but of power and of love and of a sound mind.',ref:'2 Timothy 1:7',category:'Courage'},
  {text:'Be strong and courageous, because the Lord your God will be with you wherever you go.',ref:'Joshua 1:9',category:'Courage'},
  {text:'The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.',ref:'Galatians 5:22–23',category:'Character'},
  {text:'Above all else, guard your heart, for everything you do flows from it.',ref:'Proverbs 4:23',category:'Wisdom'},
  {text:'A gentle answer turns away wrath, but a harsh word stirs up anger.',ref:'Proverbs 15:1',category:'Wisdom'},
  {text:'Let your conversation be always full of grace, seasoned with salt.',ref:'Colossians 4:6',category:'Wisdom'},
  {text:'He heals the brokenhearted and binds up their wounds.',ref:'Psalm 147:3',category:'Healing'},
  {text:'The Lord is my strength and my shield; my heart trusts in him.',ref:'Psalm 28:7',category:'Strength'},
  {text:'Wait for the Lord; be strong and take heart and wait for the Lord.',ref:'Psalm 27:14',category:'Patience'},
  {text:'Delight yourself in the Lord, and he will give you the desires of your heart.',ref:'Psalm 37:4',category:'Joy'},
  {text:'In the beginning God created the heavens and the earth.',ref:'Genesis 1:1',category:'Creation'},
  {text:'And God saw all that he had made, and it was very good.',ref:'Genesis 1:31',category:'Creation'},
  {text:'Blessed is the one who does not walk in step with the wicked, but whose delight is in the law of the Lord.',ref:'Psalm 1:1–2',category:'Wisdom'},
  {text:'The Lord is my light and my salvation — whom shall I fear?',ref:'Psalm 27:1',category:'Courage'},
  {text:'You will keep in perfect peace those whose minds are steadfast, because they trust in you.',ref:'Isaiah 26:3',category:'Peace'},
  {text:'My grace is sufficient for you, for my power is made perfect in weakness.',ref:'2 Corinthians 12:9',category:'Grace'},
  {text:'If we confess our sins, he is faithful and just and will forgive us our sins.',ref:'1 John 1:9',category:'Grace'},
  {text:'There is no condemnation for those who are in Christ Jesus.',ref:'Romans 8:1',category:'Grace'},
  {text:'For by grace you have been saved through faith.',ref:'Ephesians 2:8',category:'Grace'},
  {text:'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',ref:'Galatians 6:9',category:'Perseverance'},
  {text:'Consider it pure joy whenever you face trials of many kinds, because the testing of your faith produces perseverance.',ref:'James 1:2–3',category:'Perseverance'},
  {text:'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',ref:'Ephesians 4:32',category:'Kindness'},
  {text:'Above all, love each other deeply, because love covers over a multitude of sins.',ref:'1 Peter 4:8',category:'Love'},
  {text:'Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.',ref:'Hebrews 12:1–2',category:'Perseverance'},
  {text:'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.',ref:'Nahum 1:7',category:'Comfort'},
  {text:'Even though I walk through the darkest valley, I will fear no evil, for you are with me.',ref:'Psalm 23:4',category:'Comfort'},
  {text:'My soul finds rest in God alone; my salvation comes from him.',ref:'Psalm 62:1',category:'Rest'},
  {text:'You are the light of the world. A town built on a hill cannot be hidden.',ref:'Matthew 5:14',category:'Purpose'},
  {text:'Seek first his kingdom and his righteousness, and all these things will be given to you as well.',ref:'Matthew 6:33',category:'Purpose'},
  {text:'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.',ref:'Matthew 7:7',category:'Prayer'},
  {text:'The Lord is near to all who call on him, to all who call on him in truth.',ref:'Psalm 145:18',category:'Prayer'},
  {text:'Pray continually, give thanks in all circumstances.',ref:'1 Thessalonians 5:17–18',category:'Prayer'},
  {text:'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',ref:'Philippians 4:6',category:'Peace'},
  {text:'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',ref:'Philippians 4:7',category:'Peace'},
  {text:'Finally, whatever is true, whatever is noble, whatever is right, whatever is pure — think about such things.',ref:'Philippians 4:8',category:'Mind'},
  {text:'Clothe yourselves with compassion, kindness, humility, gentleness and patience.',ref:'Colossians 3:12',category:'Character'},
  {text:'Let the peace of Christ rule in your hearts.',ref:'Colossians 3:15',category:'Peace'},
  {text:'I am with you always, to the very end of the age.',ref:'Matthew 28:20',category:'Presence'},
  {text:'Never will I leave you; never will I forsake you.',ref:'Hebrews 13:5',category:'Presence'},
  {text:'The heavens declare the glory of God; the skies proclaim the work of his hands.',ref:'Psalm 19:1',category:'Wonder'},
  {text:'Taste and see that the Lord is good; blessed is the one who takes refuge in him.',ref:'Psalm 34:8',category:'Joy'},
  {text:'This is the day the Lord has made; let us rejoice and be glad in it.',ref:'Psalm 118:24',category:'Joy'},
  {text:'The joy of the Lord is your strength.',ref:'Nehemiah 8:10',category:'Joy'},
  {text:'A cheerful heart is good medicine.',ref:'Proverbs 17:22',category:'Joy'},
  {text:'Weeping may stay for the night, but rejoicing comes in the morning.',ref:'Psalm 30:5',category:'Hope'},
  {text:'Hope does not put us to shame, because God’s love has been poured out into our hearts.',ref:'Romans 5:5',category:'Hope'},
  {text:'I remain confident of this: I will see the goodness of the Lord in the land of the living.',ref:'Psalm 27:13',category:'Hope'},
  {text:'For the Lord is good and his love endures forever.',ref:'Psalm 100:5',category:'Gratitude'},
  {text:'Give thanks to the Lord, for he is good; his love endures forever.',ref:'Psalm 107:1',category:'Gratitude'},
  {text:'In everything, give thanks.',ref:'1 Thessalonians 5:18',category:'Gratitude'},
  {text:'Now faith is confidence in what we hope for and assurance about what we do not see.',ref:'Hebrews 11:1',category:'Faith'},
  {text:'For we live by faith, not by sight.',ref:'2 Corinthians 5:7',category:'Faith'},
  {text:'If you have faith as small as a mustard seed, you can say to this mountain, “Move from here to there,” and it will move.',ref:'Matthew 17:20',category:'Faith'},
  {text:'I have fought the good fight, I have finished the race, I have kept the faith.',ref:'2 Timothy 4:7',category:'Faith'},
  {text:'Therefore what God has joined together, let no one separate.',ref:'Mark 10:9',category:'Marriage'},
  {text:'Husbands, love your wives, just as Christ loved the church and gave himself up for her.',ref:'Ephesians 5:25',category:'Marriage'},
  {text:'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.',ref:'Ecclesiastes 4:9–10',category:'Marriage'},
  {text:'Let marriage be held in honor among all.',ref:'Hebrews 13:4',category:'Marriage'},
  {text:'And now these three remain: faith, hope and love. But the greatest of these is love.',ref:'1 Corinthians 13:13',category:'Wedding'},
  {text:'I have found the one whom my soul loves.',ref:'Song of Solomon 3:4',category:'Wedding'},
  {text:'Set me as a seal upon your heart, as a seal upon your arm, for love is strong as death.',ref:'Song of Solomon 8:7',category:'Wedding'},
  {text:'For the love of money is a root of all kinds of evil.',ref:'1 Timothy 6:10',category:'Money'},
  {text:'Keep your lives free from the love of money and be content with what you have, because God has said, “Never will I leave you; never will I forsake you.”',ref:'Hebrews 13:5',category:'Money'},
  {text:'Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.',ref:'2 Corinthians 9:7',category:'Money'},
  {text:'In your anger do not sin: Do not let the sun go down while you are still angry.',ref:'Ephesians 4:26',category:'Anger'},
  {text:'Everyone should be quick to listen, slow to speak and slow to become angry.',ref:'James 1:19',category:'Anger'},
  {text:'Refrain from anger and turn from wrath; do not fret—it leads only to evil.',ref:'Psalm 37:8',category:'Anger'},
  {text:'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',ref:'Ephesians 4:32',category:'Forgiveness'},
  {text:'For if you forgive other people when they sin against you, your heavenly Father will also forgive you.',ref:'Matthew 6:14',category:'Forgiveness'},
  {text:'As far as the east is from the west, so far has he removed our transgressions from us.',ref:'Psalm 103:12',category:'Forgiveness'},
];

const CHAPTERS: Record<string, string[]> = {
  'Psalm 23': [
    'The Lord is my shepherd, I lack nothing.',
    'He makes me lie down in green pastures, he leads me beside quiet waters,',
    'he refreshes my soul. He guides me along the right paths for his name’s sake.',
    'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
    'You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.',
    'Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.',
  ],
  'Psalm 1': [
    'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers,',
    'but whose delight is in the law of the Lord, and who meditates on his law day and night.',
    'That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither — whatever they do prospers.',
    'Not so the wicked! They are like chaff that the wind blows away.',
    'Therefore the wicked will not stand in the judgment, nor sinners in the assembly of the righteous.',
    'For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction.',
  ],
  '1 Corinthians 13': [
    'If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong or a clanging cymbal.',
    'If I have the gift of prophecy and can fathom all mysteries and all knowledge, and if I have a faith that can move mountains, but do not have love, I am nothing.',
    'If I give all I possess to the poor and give over my body to hardship that I may boast, but do not have love, I gain nothing.',
    'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',
    'It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
    'Love does not delight in evil but rejoices with the truth.',
    'It always protects, always trusts, always hopes, always perseveres.',
    'Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled; where there is knowledge, it will pass away.',
    'For we know in part and we prophesy in part,',
    'but when completeness comes, what is in part disappears.',
    'When I was a child, I talked like a child, I thought like a child, I reasoned like a child. When I became a man, I put the ways of childhood behind me.',
    'For now we see only a reflection as in a mirror; then we shall see face to face. Now I know in part; then I shall know fully, even as I am fully known.',
    'And now these three remain: faith, hope and love. But the greatest of these is love.',
  ],
  'Genesis 1': [
    'In the beginning God created the heavens and the earth.',
    'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
    'And God said, “Let there be light,” and there was light.',
    'God saw that the light was good, and he separated the light from the darkness.',
    'God called the light “day,” and the darkness he called “night.” And there was evening, and there was morning — the first day.',
    'And God said, “Let there be a vault between the waters to separate water from water.”',
    'So God made the vault and separated the water under the vault from the water above it. And it was so.',
    'God called the vault “sky.” And there was evening, and there was morning — the second day.',
    'And God said, “Let the water under the sky be gathered to one place, and let dry ground appear.” And it was so.',
    'God called the dry ground “land,” and the gathered waters he called “seas.” And God saw that it was good.',
    'Then God said, “Let the land produce vegetation: seed-bearing plants and trees on the land that bear fruit with seed in it, according to their various kinds.” And it was so.',
    'The land produced vegetation: plants bearing seed according to their kinds and trees bearing fruit with seed in it according to their kinds. And God saw that it was good.',
    'And there was evening, and there was morning — the third day.',
    'And God said, “Let there be lights in the vault of the sky to separate the day from the night, and let them serve as signs to mark sacred times, and days and years,',
    'and let them be lights in the vault of the sky to give light on the earth.” And it was so.',
    'God made two great lights — the greater light to govern the day and the lesser light to govern the night. He also made the stars.',
    'God set them in the vault of the sky to give light on the earth,',
    'to govern the day and the night, and to separate light from darkness. And God saw that it was good.',
    'And there was evening, and there was morning — the fourth day.',
    'And God said, “Let the water teem with living creatures, and let birds fly above the earth across the vault of the sky.”',
    'So God created the great creatures of the sea and every living thing with which the water teems and that moves about in it, according to their kinds, and every winged bird according to its kind. And God saw that it was good.',
    'God blessed them and said, “Be fruitful and increase in number and fill the water in the seas, and let the birds increase on the earth.”',
    'And there was evening, and there was morning — the fifth day.',
    'And God said, “Let the land produce living creatures according to their kinds: the livestock, the creatures that move along the ground, and the wild animals, each according to its kind.” And it was so.',
    'God made the wild animals according to their kinds, the livestock according to their kinds, and all the creatures that move along the ground according to their kinds. And God saw that it was good.',
    'Then God said, “Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground.”',
    'So God created mankind in his own image, in the image of God he created them; male and female he created them.',
    'God blessed them and said to them, “Be fruitful and increase in number; fill the earth and subdue it. Rule over the fish in the sea and the birds in the sky and over every living creature that moves on the ground.”',
    'Then God said, “I give you every seed-bearing plant on the face of the whole earth and every tree that has fruit with seed in it. They will be yours for food.',
    'And to all the beasts of the earth and all the birds in the sky and all the creatures that move along the ground — everything that has the breath of life in it — I give every green plant for food.” And it was so.',
    'God saw all that he had made, and it was very good. And there was evening, and there was morning — the sixth day.',
  ],
  'Psalm 121': [
    'I lift up my eyes to the mountains — where does my help come from?',
    'My help comes from the Lord, the Maker of heaven and earth.',
    'He will not let your foot slip — he who watches over you will not slumber;',
    'indeed, he who watches over Israel will neither slumber nor sleep.',
    'The Lord watches over you — the Lord is your shade at your right hand;',
    'the sun will not harm you by day, nor the moon by night.',
    'The Lord will keep you from all harm — he will watch over your life;',
    'the Lord will watch over your coming and going both now and forevermore.',
  ],
  'Psalm 46': [
    'God is our refuge and strength, an ever-present help in trouble.',
    'Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea,',
    'though its waters roar and foam and the mountains quake with their surging.',
    'There is a river whose streams make glad the city of God, the holy place where the Most High dwells.',
    'God is within her, she will not fall; God will help her at break of day.',
    'Nations are in uproar, kingdoms fall; he lifts his voice, the earth melts.',
    'The Lord Almighty is with us; the God of Jacob is our fortress.',
    'Come and see what the Lord has done, the desolations he has brought on the earth.',
    'He makes wars cease to the ends of the earth. He breaks the bow and shatters the spear; he burns the shields with fire.',
    'He says, “Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.”',
    'The Lord Almighty is with us; the God of Jacob is our fortress.',
  ],
  'Psalm 100': [
    'Shout for joy to the Lord, all the earth.',
    'Worship the Lord with gladness; come before him with joyful songs.',
    'Know that the Lord is God. It is he who made us, and we are his; we are his people, the sheep of his pasture.',
    'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
    'For the Lord is good and his love endures forever; his faithfulness continues through all generations.',
  ],
  'Psalm 19': [
    'The heavens declare the glory of God; the skies proclaim the work of his hands.',
    'Day after day they pour forth speech; night after night they reveal knowledge.',
    'They have no speech, they use no words; no sound is heard from them.',
    'Yet their voice goes out into all the earth, their words to the ends of the world. In the heavens God has pitched a tent for the sun.',
    'It is like a bridegroom coming out of his chamber, like a champion rejoicing to run his course.',
    'It rises at one end of the heavens and makes its circuit to the other; nothing is deprived of its warmth.',
    'The law of the Lord is perfect, refreshing the soul. The statutes of the Lord are trustworthy, making wise the simple.',
    'The precepts of the Lord are right, giving joy to the heart. The commands of the Lord are radiant, giving light to the eyes.',
    'The fear of the Lord is pure, enduring forever. The decrees of the Lord are firm, and all of them are righteous.',
    'They are more precious than gold, than much pure gold; they are sweeter than honey, than honey from the honeycomb.',
    'By them your servant is warned; in keeping them there is great reward.',
    'But who can discern their own errors? Forgive my hidden faults.',
    'Keep your servant also from willful sins; may they not rule over me. Then I will be blameless, innocent of great transgression.',
    'May these words of my mouth and this meditation of my heart be pleasing in your sight, Lord, my Rock and my Redeemer.',
  ],
  'John 3': [
    'Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council.',
    'He came to Jesus at night and said, “Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him.”',
    'Jesus replied, “Very truly I tell you, no one can see the kingdom of God unless they are born again.”',
    '“How can someone be born when they are old?” Nicodemus asked. “Surely they cannot enter a second time into their mother’s womb to be born!”',
    'Jesus answered, “Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit.',
    'Flesh gives birth to flesh, but the Spirit gives birth to spirit.',
    'You should not be surprised at my saying, ‘You must be born again.’',
    'The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit.”',
    '“How can this be?” Nicodemus asked.',
    '“You are Israel’s teacher,” said Jesus, “and do you not understand these things?',
    'Very truly I tell you, we speak of what we know, and we testify to what we have seen, but still you people do not accept our testimony.',
    'I have spoken to you of earthly things and you do not believe; how then will you believe if I speak of heavenly things?',
    'No one has ever gone into heaven except the one who came from heaven — the Son of Man.',
    'Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up,',
    'that everyone who believes may have eternal life in him.”',
    'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    'For God did not send his Son into the world to condemn the world, but to save the world through him.',
    'Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God’s one and only Son.',
    'This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil.',
    'Everyone who does evil hates the light, and will not come into the light for fear that their deeds will be exposed.',
    'But whoever lives by the truth comes into the light, so that it may be seen plainly that what they have done has been done in the sight of God.',
    'After this, Jesus and his disciples went out into the Judean countryside, where he spent some time with them, and baptized.',
    'Now John also was baptizing at Aenon near Salim, because there was plenty of water, and people were constantly coming to be baptized.',
    'This was before John was put in prison.',
    'An argument developed between some of John’s disciples and a certain Jew over the matter of ceremonial washing.',
    'They came to John and said to him, “Rabbi, that man who was with you on the other side of the Jordan — the one you testified about — look, he is baptizing, and everyone is going to him.”',
    'To this John replied, “A person can receive only what is given them from heaven.',
    'You yourselves can testify that I said, ‘I am not the Messiah but am sent ahead of him.’',
    'The bride belongs to the bridegroom. The friend who attends the bridegroom waits and listens for him, and is full of joy when he hears the bridegroom’s voice. That joy is mine, and it is now complete.',
    'He must become greater; I must become less.”',
    'The one who comes from above is above all; the one who is from the earth belongs to the earth, and speaks as one from the earth. The one who comes from heaven is above all.',
    'He testifies to what he has seen and heard, but no one accepts his testimony.',
    'Whoever has accepted it has certified that God is truthful.',
    'For the one whom God has sent speaks the words of God, for God gives the Spirit without limit.',
    'The Father loves the Son and has placed everything in his hands.',
    'Whoever believes in the Son has eternal life, but whoever rejects the Son will not see life, for God’s wrath remains on them.',
  ],
  'Philippians 4': [
    'Therefore, my brothers and sisters, you whom I love and long for, my joy and crown, stand firm in the Lord in this way, dear friends!',
    'I plead with Euodia and I plead with Syntyche to be of the same mind in the Lord.',
    'Yes, and I ask you, my true companion, help these women since they have contended at my side in the cause of the gospel, along with Clement and the rest of my co-workers, whose names are in the book of life.',
    'Rejoice in the Lord always. I will say it again: Rejoice!',
    'Let your gentleness be evident to all. The Lord is near.',
    'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
    'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable — if anything is excellent or praiseworthy — think about such things.',
    'Whatever you have learned or received or heard from me, or seen in me — put it into practice. And the God of peace will be with you.',
    'I rejoiced greatly in the Lord that at last you renewed your concern for me. Indeed, you were concerned, but you had no opportunity to show it.',
    'I am not saying this because I am in need, for I have learned to be content whatever the circumstances.',
    'I know what it is to be in need, and I know what it is to have plenty. I have learned the secret of being content in any and every situation, whether well fed or hungry, whether living in plenty or in want.',
    'I can do all this through him who gives me strength.',
    'Yet it was good of you to share in my troubles.',
    'Moreover, as you Philippians know, in the early days of your acquaintance with the gospel, when I set out from Macedonia, not one church shared with me in the matter of giving and receiving, except you only;',
    'for even when I was in Thessalonica, you sent me aid more than once when I was in need.',
    'Not that I desire your gifts; what I desire is that more be credited to your account.',
    'I have received full payment and have more than enough. I am amply supplied, now that I have received from Epaphroditus the gifts you sent. They are a fragrant offering, an acceptable sacrifice, pleasing to God.',
    'And my God will meet all your needs according to the riches of his glory in Christ Jesus.',
    'To our God and Father be glory for ever and ever. Amen.',
    'Greet all God’s people in Christ Jesus. The brothers and sisters who are with me send greetings.',
    'All God’s people here send you greetings, especially those who belong to Caesar’s household.',
    'The grace of the Lord Jesus Christ be with your spirit. Amen.',
  ],
  'Romans 8': [
    'Therefore, there is now no condemnation for those who are in Christ Jesus,',
    'because through Christ Jesus the law of the Spirit who gives life has set you free from the law of sin and death.',
    'For what the law was powerless to do because it was weakened by the flesh, God did by sending his own Son in the likeness of sinful flesh to be a sin offering. And so he condemned sin in the flesh,',
    'in order that the righteous requirement of the law might be fully met in us, who do not live according to the flesh but according to the Spirit.',
    'Those who live according to the flesh have their minds set on what the flesh desires; but those who live in accordance with the Spirit have their minds set on what the Spirit desires.',
    'The mind governed by the flesh is death, but the mind governed by the Spirit is life and peace.',
    'The mind governed by the flesh is hostile to God; it does not submit to God’s law, nor can it do so.',
    'Those who are in the realm of the flesh cannot please God.',
    'You, however, are not in the realm of the flesh but are in the realm of the Spirit, if indeed the Spirit of God lives in you. And if anyone does not have the Spirit of Christ, they do not belong to Christ.',
    'But if Christ is in you, then even though your body is subject to death because of sin, the Spirit gives life because of righteousness.',
    'And if the Spirit of him who raised Jesus from the dead is living in you, he who raised Christ from the dead will also give life to your mortal bodies because of his Spirit who lives in you.',
    'Therefore, brothers and sisters, we have an obligation — but it is not to the flesh, to live according to it.',
    'For if you live according to the flesh, you will die; but if by the Spirit you put to death the misdeeds of the body, you will live.',
    'For those who are led by the Spirit of God are the children of God.',
    'The Spirit you received does not make you slaves, so that you live in fear again; rather, the Spirit you received brought about your adoption to sonship. And by him we cry, “Abba, Father.”',
    'The Spirit himself testifies with our spirit that we are God’s children.',
    'Now if we are children, then we are heirs — heirs of God and co-heirs with Christ, if indeed we share in his sufferings in order that we may also share in his glory.',
    'I consider that our present sufferings are not worth comparing with the glory that will be revealed in us.',
    'For the creation waits in eager expectation for the children of God to be revealed.',
    'For the creation was subjected to frustration, not by its own choice, but by the will of the one who subjected it, in hope',
    'that the creation itself will be liberated from its bondage to decay and brought into the freedom and glory of the children of God.',
    'We know that the whole creation has been groaning as in the pains of childbirth right up to the present time.',
    'Not only so, but we ourselves, who have the firstfruits of the Spirit, groan inwardly as we wait eagerly for our adoption to sonship, the redemption of our bodies.',
    'For in this hope we were saved. But hope that is seen is no hope at all. Who hopes for what they already have?',
    'But if we hope for what we do not yet have, we wait for it patiently.',
    'In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us through wordless groans.',
    'And he who searches our hearts knows the mind of the Spirit, because the Spirit intercedes for God’s people in accordance with the will of God.',
    'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    'For those God foreknew he also predestined to be conformed to the image of his Son, that he might be the firstborn among many brothers and sisters.',
    'And those he predestined, he also called; those he called, he also justified; those he justified, he also glorified.',
    'What, then, shall we say in response to these things? If God is for us, who can be against us?',
    'He who did not spare his own Son, but gave him up for us all — how will he not also, along with him, graciously give us all things?',
    'Who will bring any charge against those whom God has chosen? It is God who justifies.',
    'Who then is the one who condemns? No one. Christ Jesus who died — more than that, who was raised to life — is at the right hand of God and is also interceding for us.',
    'Who shall separate us from the love of Christ? Shall trouble or hardship or persecution or famine or nakedness or danger or sword?',
    'As it is written: “For your sake we face death all day long; we are considered as sheep to be slaughtered.”',
    'No, in all these things we are more than conquerors through him who loved us.',
    'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,',
    'neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.',
  ],
  'Proverbs 3': [
    'My son, do not forget my teaching, but keep my commands in your heart,',
    'for they will prolong your life many years and bring you peace and prosperity.',
    'Let love and faithfulness never leave you; bind them around your neck, write them on the tablet of your heart.',
    'Then you will win favor and a good name in the sight of God and man.',
    'Trust in the Lord with all your heart and lean not on your own understanding;',
    'in all your ways submit to him, and he will make your paths straight.',
    'Do not be wise in your own eyes; fear the Lord and shun evil.',
    'This will bring health to your body and nourishment to your bones.',
    'Honor the Lord with your wealth, with the firstfruits of all your crops;',
    'then your barns will be filled to overflowing, and your vats will brim over with new wine.',
    'My son, do not despise the Lord’s discipline, and do not resent his rebuke,',
    'because the Lord disciplines those he loves, as a father the son he delights in.',
    'Blessed are those who find wisdom, those who gain understanding,',
    'for she is more profitable than silver and yields better returns than gold.',
    'She is more precious than rubies; nothing you desire can compare with her.',
    'Long life is in her right hand; in her left hand are riches and honor.',
    'Her ways are pleasant ways, and all her paths are peace.',
    'She is a tree of life to those who take hold of her; those who hold her fast will be blessed.',
    'By wisdom the Lord laid the earth’s foundations, by understanding he set the heavens in place;',
    'by his knowledge the watery depths were divided, and the clouds let drop the dew.',
    'My son, do not let wisdom and understanding out of your sight, preserve sound judgment and discretion;',
    'they will be life for you, an ornament to grace your neck.',
    'Then you will go on your way in safety, and your foot will not stumble.',
    'When you lie down, you will not be afraid; when you lie down, your sleep will be sweet.',
    'Have no fear of sudden disaster or of the ruin that overtakes the wicked,',
    'for the Lord will be at your side and will keep your foot from being caught in a trap.',
    'Do not withhold good from those to whom it is due, when it is in your power to act.',
    'Do not say to your neighbor, “Come back tomorrow and I’ll give it to you” — when you already have it with you.',
    'Do not plot harm against your neighbor, who lives trustfully near you.',
    'Do not accuse anyone for no reason — when they have done you no harm.',
    'Do not envy the violent or choose any of their ways.',
    'For the Lord detests the perverse but takes the upright into his confidence.',
    'The Lord’s curse is on the house of the wicked, but he blesses the home of the righteous.',
    'He mocks proud mockers but shows favor to the humble and oppressed.',
    'The wise inherit honor, but fools get only shame.',
  ],
  'Isaiah 40': [
    'Comfort, comfort my people, says your God.',
    'Speak tenderly to Jerusalem, and proclaim to her that her hard service has been completed, that her sin has been paid for, that she has received from the Lord’s hand double for all her sins.',
    'A voice of one calling: “In the wilderness prepare the way for the Lord; make straight in the desert a highway for our God.',
    'Every valley shall be raised up, every mountain and hill made low; the rough ground shall become level, the rugged places a plain.',
    'And the glory of the Lord will be revealed, and all people will see it together. For the mouth of the Lord has spoken.”',
    'A voice says, “Cry out.” And I said, “What shall I cry?” “All people are like grass, and all their faithfulness is like the flowers of the field.',
    'The grass withers and the flowers fall, because the breath of the Lord blows on them. Surely the people are grass.',
    'The grass withers and the flowers fall, but the word of our God endures forever.”',
    'You who bring good news to Zion, go up on a high mountain. You who bring good news to Jerusalem, lift up your voice with a shout, lift it up, do not be afraid; say to the towns of Judah, “Here is your God!”',
    'See, the Sovereign Lord comes with power, and he rules with a mighty arm. See, his reward is with him, and his recompense accompanies him.',
    'He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart; he gently leads those that have young.',
    'Who has measured the waters in the hollow of his hand, or with the breadth of his hand marked off the heavens? Who has held the dust of the earth in a basket, or weighed the mountains on the scales and the hills in a balance?',
    'Who can fathom the Spirit of the Lord, or instruct the Lord as his counselor?',
    'Whom did the Lord consult to enlighten him, and who taught him the right way? Who was it that taught him knowledge, or showed him the path of understanding?',
    'Surely the nations are like a drop in a bucket; they are regarded as dust on the scales; he weighs the islands as though they were fine dust.',
    'Lebanon is not sufficient for altar fires, nor its animals enough for burnt offerings.',
    'Before him all the nations are as nothing; they are regarded by him as worthless and less than nothing.',
    'With whom, then, will you compare God? To what image will you liken him?',
    'As for an idol, a metalworker casts it, and a goldsmith overlays it with gold and fashions silver chains for it.',
    'A person too poor to present such an offering selects wood that will not rot; they look for a skilled worker to set up an idol that will not topple.',
    'Do you not know? Have you not heard? Has it not been told you from the beginning? Have you not understood since the earth was founded?',
    'He sits enthroned above the circle of the earth, and its people are like grasshoppers. He stretches out the heavens like a canopy, and spreads them out like a tent to live in.',
    'He brings princes to naught and reduces the rulers of this world to nothing.',
    'No sooner are they planted, no sooner are they sown, no sooner do they take root in the ground, than he blows on them and they wither, and a whirlwind sweeps them away like chaff.',
    '“To whom will you compare me? Or who is my equal?” says the Holy One.',
    'Lift up your eyes and look to the heavens: Who created all these? He who brings out the starry host one by one and calls forth each of them by name. Because of his great power and mighty strength, not one of them is missing.',
    'Why do you complain, Jacob? Why do you say, Israel, “My way is hidden from the Lord; my cause is disregarded by my God”?',
    'Do you not know? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth. He will not grow tired or weary, and his understanding no one can fathom.',
    'He gives strength to the weary and increases the power of the weak.',
    'Even youths grow tired and weary, and young men stumble and fall;',
    'but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
  ],
  'Matthew 5': [
    'Now when Jesus saw the crowds, he went up on a mountainside and sat down. His disciples came to him,',
    'and he began to teach them. He said:',
    '“Blessed are the poor in spirit, for theirs is the kingdom of heaven.',
    'Blessed are those who mourn, for they will be comforted.',
    'Blessed are the meek, for they will inherit the earth.',
    'Blessed are those who hunger and thirst for righteousness, for they will be filled.',
    'Blessed are the merciful, for they will be shown mercy.',
    'Blessed are the pure in heart, for they will see God.',
    'Blessed are the peacemakers, for they will be called children of God.',
    'Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.',
    'Blessed are you when people insult you, persecute you and falsely say all kinds of evil against you because of me.',
    'Rejoice and be glad, because great is your reward in heaven, for in the same way they persecuted the prophets who were before you.',
    'You are the salt of the earth. But if the salt loses its saltiness, how can it be made salty again? It is no longer good for anything, except to be thrown out and trampled underfoot.',
    'You are the light of the world. A town built on a hill cannot be hidden.',
    'Neither do people light a lamp and put it under a bowl. Instead they put it on its stand, and it gives light to everyone in the house.',
    'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.',
    'Do not think that I have come to abolish the Law or the Prophets; I have not come to abolish them but to fulfill them.',
    'For truly I tell you, until heaven and earth disappear, not the smallest letter, not the least stroke of a pen, will by any means disappear from the Law until everything is accomplished.',
    'Therefore anyone who sets aside one of the least of these commands and teaches others accordingly will be called least in the kingdom of heaven, but whoever practices and teaches these commands will be called great in the kingdom of heaven.',
    'For I tell you that unless your righteousness surpasses that of the Pharisees and the teachers of the law, you will certainly not enter the kingdom of heaven.',
    'You have heard that it was said to the people long ago, ‘You shall not murder, and anyone who murders will be subject to judgment.’',
    'But I tell you that anyone who is angry with a brother or sister will be subject to judgment.',
    'Therefore, if you are offering your gift at the altar and there remember that your brother or sister has something against you,',
    'leave your gift there in front of the altar. First go and be reconciled to them; then come and offer your gift.',
    'Settle matters quickly with your adversary who is taking you to court.',
    'You have heard that it was said, ‘You shall not commit adultery.’',
    'But I tell you that anyone who looks at a woman lustfully has already committed adultery with her in his heart.',
    'If your right eye causes you to stumble, gouge it out and throw it away. It is better for you to lose one part of your body than for your whole body to be thrown into hell.',
    'And if your right hand causes you to stumble, cut it off and throw it away. It is better for you to lose one part of your body than for your whole body to go into hell.',
    'It has been said, ‘Anyone who divorces his wife must give her a certificate of divorce.’',
    'But I tell you that anyone who divorces his wife, except for sexual immorality, makes her the victim of adultery, and anyone who marries a divorced woman commits adultery.',
    'Again, you have heard that it was said to the people long ago, ‘Do not break your oath, but fulfill to the Lord the vows you have made.’',
    'But I tell you, do not swear an oath at all: either by heaven, for it is God’s throne;',
    'or by the earth, for it is his footstool; or by Jerusalem, for it is the city of the Great King.',
    'And do not swear by your head, for you cannot make even one hair white or black.',
    'All you need to say is simply ‘Yes’ or ‘No’; anything beyond this comes from the evil one.',
    'You have heard that it was said, ‘Eye for eye, and tooth for tooth.’',
    'But I tell you, do not resist an evil person. If anyone slaps you on the right cheek, turn to them the other cheek also.',
    'And if anyone wants to sue you and take your shirt, hand over your coat as well.',
    'If anyone forces you to go one mile, go with them two miles.',
    'Give to the one who asks you, and do not turn away from the one who wants to borrow from you.',
    'You have heard that it was said, ‘Love your neighbor and hate your enemy.’',
    'But I tell you, love your enemies and pray for those who persecute you,',
    'that you may be children of your Father in heaven. He causes his sun to rise on the evil and the good, and sends rain on the righteous and the unrighteous.',
    'If you love those who love you, what reward will you get? Are not even the tax collectors doing that?',
    'And if you greet only your own people, what are you doing more than others? Do not even pagans do that?',
    'Be perfect, therefore, as your heavenly Father is perfect.',
  ],
  'Romans 12': [
    'Therefore, I urge you, brothers and sisters, in view of God’s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God — this is your true and proper worship.',
    'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God’s will is — his good, pleasing and perfect will.',
    'For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you.',
    'For just as each of us has one body with many members, and these members do not all have the same function,',
    'so in Christ we, though many, form one body, and each member belongs to all the others.',
    'We have different gifts, according to the grace given to each of us. If your gift is prophesying, then prophesy in accordance with your faith;',
    'if it is serving, then serve; if it is teaching, then teach;',
    'if it is to encourage, then give encouragement; if it is giving, then give generously; if it is to lead, do it diligently; if it is to show mercy, do it cheerfully.',
    'Love must be sincere. Hate what is evil; cling to what is good.',
    'Be devoted to one another in love. Honor one another above yourselves.',
    'Never be lacking in zeal, but keep your spiritual fervor, serving the Lord.',
    'Be joyful in hope, patient in affliction, faithful in prayer.',
    'Share with the Lord’s people who are in need. Practice hospitality.',
    'Bless those who persecute you; bless and do not curse.',
    'Rejoice with those who rejoice; mourn with those who mourn.',
    'Live in harmony with one another. Do not be proud, but be willing to associate with people of low position. Do not be conceited.',
    'Do not repay anyone evil for evil. Be careful to do what is right in the eyes of everyone.',
    'If it is possible, as far as it depends on you, live at peace with everyone.',
    'Do not take revenge, my dear friends, but leave room for God’s wrath, for it is written: “It is mine to avenge; I will repay,” says the Lord.',
    'On the contrary: “If your enemy is hungry, feed him; if he is thirsty, give him something to drink. In doing this, you will heap burning coals on his head.”',
    'Do not be overcome by evil, but overcome evil with good.',
  ],
};
const PLAN = [
  {day:1,title:'Begin Again',ref:'Genesis 1',note:'Creation — you are made with intention.'},
  {day:2,title:'A Shepherd’s Peace',ref:'Psalm 23',note:'Rest — you lack nothing with God.'},
  {day:3,title:'Wisdom for the Road',ref:'Proverbs 3',note:'Trust — lean into God’s guidance.'},
  {day:4,title:'Born Again',ref:'John 3',note:'New life — loved beyond measure.'},
  {day:5,title:'No Condemnation',ref:'Romans 8',note:'Freedom — nothing separates you.'},
  {day:6,title:'The Greatest Gift',ref:'1 Corinthians 13',note:'Love — the way that never fails.'},
  {day:7,title:'Strength to Soar',ref:'Isaiah 40',note:'Renewal — hope lifts weary wings.'},
];
const TOPICS = ['Love','Faith','Hope','Strength','Comfort','Wisdom','Peace','Gratitude','Courage','Grace','Prayer','Joy','Guidance','Healing','Perseverance','Purpose','Rest','Memory','Forgiveness','Marriage','Wedding','Money','Anger'];
const MOODS = [
  {name:'Anxious', prompt:'A little room to breathe.',cats:['Peace','Comfort','Courage']},
  {name:'Grieving', prompt:'For the days that ask more of you.',cats:['Comfort','Healing','Hope']},
  {name:'Grateful', prompt:'Notice what is already here.',cats:['Gratitude','Joy','Wonder']},
  {name:'Lonely', prompt:'You are seen, known, and not forgotten.',cats:['Presence','Comfort','Love']},
  {name:'Angry', prompt:'Make room for a slower, gentler answer.',cats:['Wisdom','Peace','Kindness']},
  {name:'Hopeful', prompt:'Keep a small light close today.',cats:['Hope','Strength','Joy']},
  {name:'Fearful', prompt:'Courage can have company.',cats:['Courage','Presence','Faith']},
  {name:'Needing direction', prompt:'You only need the next faithful step.',cats:['Guidance','Wisdom','Faith']},
  {name:'Tired', prompt:'Rest is not something to earn.',cats:['Rest','Comfort','Peace']},
  {name:'Joyful', prompt:'Let good things be worth celebrating.',cats:['Joy','Gratitude','Love']},
];
const COLORS = ['#e3c66f','#a7c4a7','#94b7cf','#d5a5ad'];
const DEFAULT_STORE: Store = {
  preferences:{theme:'light',fontSize:22,fontFamily:'serif'},
  progress:{readChapterKeys:[],streak:0,dailyGoal:1,readingHistory:[]},
  saved:[],notes:[],highlights:[],bookmarks:[],planDone:[],game:{points:0,rounds:0,verseRef:'John 3:16'},
};
const STORAGE_KEY = 'scripture-companion-v1';
function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }
function validStore(v: unknown): v is Store {
  if (!isRecord(v) || !isRecord(v.preferences) || !isRecord(v.progress)) return false;
  const p=v.preferences; const r=v.progress;
  const validVerse=(item:unknown):item is SavedVerse=>isRecord(item)&&typeof item.text==='string'&&typeof item.ref==='string'&&typeof item.category==='string'&&typeof item.color==='string';
  const validNote=(item:unknown):item is Note=>isRecord(item)&&typeof item.id==='string'&&typeof item.ref==='string'&&typeof item.text==='string'&&typeof item.date==='string';
  const validHighlight=(item:unknown):item is Highlight=>isRecord(item)&&typeof item.ref==='string'&&typeof item.color==='string';
  const validHistory=(item:unknown):item is {key:string;ts:number}=>isRecord(item)&&typeof item.key==='string'&&typeof item.ts==='number'&&Number.isFinite(item.ts);
  return ['light','sepia','dark'].includes(String(p.theme)) && typeof p.fontSize==='number' && p.fontSize>=18&&p.fontSize<=30 &&
    ['serif','sans'].includes(String(p.fontFamily)) && Array.isArray(r.readChapterKeys) && r.readChapterKeys.every(x=>typeof x==='string') &&
    typeof r.streak==='number'&&r.streak>=0&&typeof r.dailyGoal==='number'&&r.dailyGoal>=1&&r.dailyGoal<=5&&
    Array.isArray(r.readingHistory)&&r.readingHistory.every(validHistory)&&Array.isArray(v.saved)&&v.saved.every(validVerse)&&
    Array.isArray(v.notes)&&v.notes.every(validNote)&&Array.isArray(v.highlights)&&v.highlights.every(validHighlight)&&
    Array.isArray(v.bookmarks)&&v.bookmarks.every(x=>typeof x==='string')&&Array.isArray(v.planDone)&&v.planDone.every(x=>typeof x==='number'&&x>=1&&x<=7)&&
    isRecord(v.game)&&typeof v.game.points==='number'&&typeof v.game.rounds==='number'&&typeof v.game.verseRef==='string';
}
function loadStore(): {store: Store; broken: boolean} {
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if (!raw) return {store:DEFAULT_STORE,broken:false};
    const parsed: unknown=JSON.parse(raw);
    return validStore(parsed)?{store:parsed,broken:false}:{store:DEFAULT_STORE,broken:true};
  } catch { return {store:DEFAULT_STORE,broken:true}; }
}
function chapterLines(book: string, chapter: number): string[] | null {
  return CHAPTERS[`${book} ${chapter}`] ?? (book==='Psalms'?CHAPTERS[`Psalm ${chapter}`]??null:null);
}
function parseRef(ref: string) {
  const match=ref.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!match) return null;
  const name=match[1]==='Psalm'?'Psalms':match[1];
  const book=BOOKS.find(item=>item.name===name);
  if (!book) return null;
  const chapter=Number(match[2]);
  return chapter>0&&chapter<=book.chapterCount?{book:book.name,chapter,verse:match[3]?Number(match[3]):undefined}:null;
}
function dayStamp(ts: number) { const d=new Date(ts); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function randomItem<T>(items: T[]) { return items[Math.floor(Math.random()*items.length)]; }
function todayIndex() { const date=new Date(); return Math.floor((date.getTime()-new Date(date.getFullYear(),0,0).getTime())/86400000); }

const NAV: {section:string; items:{view:View;label:string;icon:typeof BookOpen}[]}[] = [
  {section:'Discover',items:[{view:'home',label:'Your reading room',icon:BookOpen},{view:'reader',label:'Random chapter',icon:Dices},{view:'roulette',label:'Verse roulette',icon:Shuffle},{view:'topics',label:'Browse topics',icon:Library},{view:'today',label:'Verse of the day',icon:Sparkles},{view:'mood',label:'By how you feel',icon:Heart},{view:'memorize',label:'Word order',icon:Target}]},
  {section:'Keep close',items:[{view:'tracker',label:'Reading tracker',icon:ListChecks},{view:'saved',label:'Saved & notes',icon:Bookmark},{view:'plan',label:'7-day plan',icon:ArrowDown}]},
  {section:'About',items:[{view:'how',label:'How it works',icon:CircleHelp},{view:'about',label:'About',icon:Info},{view:'privacy',label:'Privacy',icon:LockKeyhole},{view:'contact',label:'Contact',icon:NotebookPen}]},
];

export default function App() {
  const first=useRef<{store:Store;broken:boolean}|null>(null);
  if (!first.current) first.current=loadStore();
  const [store,setStore]=useState<Store>(first.current.store);
  const [view,setView]=useState<View>('home');
  const [toast,setToast]=useState(first.current.broken?'Stored data could not be read. A fresh local copy is ready.':'');
  const [book,setBook]=useState('John');
  const [chapter,setChapter]=useState(3);
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [topic,setTopic]=useState('All topics');
  const [rouletteVerse,setRouletteVerse]=useState(VERSES[2]);
  const [mood,setMood]=useState(MOODS[0].name);
  const [moodVerse,setMoodVerse]=useState(VERSES[10]);
  const [noteRef,setNoteRef]=useState<string|null>(null);
  const [noteDraft,setNoteDraft]=useState('');
  const [highlightColor,setHighlightColor]=useState(COLORS[0]);
  const [openBook,setOpenBook]=useState<string|null>(null);
  const [testament,setTestament]=useState<'All books'|'Old Testament'|'New Testament'>('All books');
  const [memoryVerse,setMemoryVerse]=useState(VERSES.find(v=>v.ref===store.game.verseRef)??VERSES[0]);
  const [memoryOrder,setMemoryOrder]=useState<string[]>([]);
  const [memoryResult,setMemoryResult]=useState('');
  const [importError,setImportError]=useState('');
  const fileInput=useRef<HTMLInputElement>(null);

  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));},[store]);
  useEffect(()=>{document.documentElement.dataset.theme=store.preferences.theme;},[store.preferences.theme]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(''),3000);return()=>window.clearTimeout(timer);},[toast]);
  useEffect(()=>{setMemoryOrder([]);setMemoryResult('');},[memoryVerse.ref]);

  const changeStore=(change:(current:Store)=>Store)=>setStore(current=>change(current));
  const setPreference=(patch:Partial<Preferences>)=>changeStore(current=>({...current,preferences:{...current.preferences,...patch}}));
  const notify=(message:string)=>setToast(message);
  const go=(target:View)=>{setView(target);window.scrollTo({top:0,behavior:'smooth'});};
  const todayVerse=VERSES[todayIndex()%VERSES.length];
  const currentKey=`${book} ${chapter}`;
  const currentBook=BOOKS.find(item=>item.name===book)??BOOKS[0];
  const currentLines=chapterLines(book,chapter);
  const isRead=store.progress.readChapterKeys.includes(currentKey);
  const filteredVerses=useMemo(()=>topic==='All topics'?VERSES:VERSES.filter(v=>v.category.toLowerCase()===topic.toLowerCase()),[topic]);
  const filteredBooks=useMemo(()=>BOOKS.filter(item=>testament==='All books'||item.testament===testament),[testament]);
  const [memoryDifficulty,setMemoryDifficulty]=useState<'Gentle'|'Steady'|'Stretch'>('Steady');
  const words=useMemo(()=>memoryVerse.text.split(/\s+/),[memoryVerse]);
  const hiddenIndexes=useMemo(()=>{
    const rate=memoryDifficulty==='Gentle'?0.18:memoryDifficulty==='Steady'?0.34:0.5;
    return new Set(words.map((_,i)=>i).filter(i=>i%Math.max(2,Math.round(1/rate))===1));
  },[words,memoryDifficulty]);
  const displayTitle=({
    home:'A small moment, just for today',
    reader:'A chapter, chosen for you',
    roulette:'Verse roulette',
    topics:'Browse by topic',
    today:'Today’s word',
    mood:'Meet this moment',
    memorize:'Put the words in order',
    tracker:'Your reading rhythm',
    saved:'Keep what stays with you',
    plan:'Seven days, one small step',
    how:'A gentle way to begin',
    about:'A personal Scripture companion',
    privacy:'Your reading stays yours',
    contact:'We would like to hear from you',
  } as Record<View,string>)[view];
  const displaySub=({
    home:'A quiet place to open a page, find a line, and return whenever you need.',
    reader:'Let a chapter find you. Where the source edition has no full chapter text, we’ll say so plainly.',
    roulette:'A small surprise from the source’s curated verse collection.',
    topics:'Find a passage by the season or question on your mind.',
    today:'A familiar line to carry into the hours ahead.',
    mood:'Choose a feeling. We’ll gather a few words from the collection around it.',
    memorize:'A simple word-order challenge using a verse from the curated collection.',
    tracker:'A private record of the chapters you choose to read.',
    saved:'Your saved verses, personal notes, and highlights live in this browser.',
    plan:'Seven short readings selected from the original plan.',
    how:'No streak pressure, no account, and no generated Scripture.',
    about:'A thoughtful corner of the web for small, unexpected moments with Scripture.',
    privacy:'Your data is stored locally on this device. Nothing is sent to a server.',
    contact:'Questions, ideas, or a kind note are all welcome.',
  } as Record<View,string>)[view];
  const changeChapter=(b:string,c:number)=>{setBook(b);setChapter(c);setView('reader');window.scrollTo({top:0,behavior:'smooth'});};
  const updateProgress=(readChapterKeys:string[],history=store.progress.readingHistory,streak=store.progress.streak,dailyGoal=store.progress.dailyGoal)=>{
    changeStore(current=>({...current,progress:{...current.progress,readChapterKeys,readingHistory:history,streak,dailyGoal}}));
  };
  const toggleRead=(key=currentKey)=>{
    const already=store.progress.readChapterKeys.includes(key);
    const next=already?store.progress.readChapterKeys.filter(item=>item!==key):[...store.progress.readChapterKeys,key];
    let history=store.progress.readingHistory;
    let streak=store.progress.streak;
    if(!already) {
      history=[...history.filter(entry=>entry.key!==key),{key,ts:Date.now()}];
      const lastDay=history.length>1?dayStamp(history[history.length-2].ts):'';
      const today=dayStamp(Date.now());
      const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
      if(lastDay!==today) streak=lastDay===dayStamp(yesterday.getTime())?streak+1:Math.max(streak,1);
    } else history=history.filter(entry=>entry.key!==key);
    updateProgress(next,history,streak);
    notify(already?`${key} marked unread`:`${key} added to your reading history`);
  };
  const saveVerse=(verse:Verse)=>{
    const found=store.saved.some(item=>item.ref===verse.ref);
    changeStore(current=>({...current,saved:found?current.saved.filter(item=>item.ref!==verse.ref):[{...verse,color:COLORS[0]},...current.saved]}));
    notify(found?'Removed from saved verses':'Saved for another moment');
  };
  const copyVerse=async(verse:Verse)=>{
    try { await navigator.clipboard.writeText(`“${verse.text}” — ${verse.ref}`);notify('Copied to clipboard'); }
    catch { notify('Clipboard access is unavailable in this browser'); }
  };
  const jumpToReference=()=>{
    const parsed=parseRef(search.trim());
    if(!parsed){notify('Try a reference like John 3 or Psalm 23:1');return;}
    setQuery('');changeChapter(parsed.book,parsed.chapter);
    if(parsed.verse) notify(`Opened ${parsed.book} ${parsed.chapter}; verse ${parsed.verse} is not separately available here.`);
  };
  const randomChapter=()=>{
    const pick=randomItem(BOOKS);
    changeChapter(pick.name,Math.floor(Math.random()*pick.chapterCount)+1);
  };
  const spinVerse=()=>{
    const pool=filteredVerses.length?filteredVerses:VERSES;
    let next=randomItem(pool);
    if(pool.length>1) while(next.ref===rouletteVerse.ref) next=randomItem(pool);
    setRouletteVerse(next);
  };
  const startMood=(name:string)=>{
    const chosen=MOODS.find(item=>item.name===name)??MOODS[0];
    const pool=VERSES.filter(v=>chosen.cats.includes(v.category));
    setMood(name);setMoodVerse(randomItem(pool.length?pool:VERSES));
  };
  const addNote=(ref:string)=>{
    const note=noteDraft.trim();
    if(!note){notify('Write a note before saving');return;}
    changeStore(current=>({...current,notes:[{id:crypto.randomUUID(),ref,text:note,date:new Date().toISOString()},...current.notes]}));
    setNoteDraft('');setNoteRef(null);notify('Note saved on this device');
  };
  const deleteNote=(id:string)=>changeStore(current=>({...current,notes:current.notes.filter(item=>item.id!==id)}));
  const toggleBookmark=(key=currentKey)=>{
    const has=store.bookmarks.includes(key);
    changeStore(current=>({...current,bookmarks:has?current.bookmarks.filter(item=>item!==key):[key,...current.bookmarks]}));
    notify(has?'Bookmark removed':'Chapter bookmarked');
  };
  const toggleHighlight=(ref:string)=>{
    const current=store.highlights.find(item=>item.ref===ref);
    changeStore(data=>({...data,highlights:current?data.highlights.filter(item=>item.ref!==ref):[...data.highlights,{ref,color:highlightColor}]}));
    notify(current?'Highlight removed':'Verse highlighted');
  };
  const markPlan=(day:number)=>{
    changeStore(current=>({...current,planDone:current.planDone.includes(day)?current.planDone.filter(item=>item!==day):[...current.planDone,day]}));
  };
  const selectPlan=(reference:string)=>{
    const parsed=parseRef(reference);if(parsed)changeChapter(parsed.book,parsed.chapter);
  };
  const checkMemory=()=>{
    const correct=words.every((word,index)=>!hiddenIndexes.has(index)||memoryOrder[index]===word);
    setMemoryResult(correct?'Exactly right. Keep the verse close.':'Not quite yet. You can reset the words and try again.');
    if(correct&&store.game.verseRef!==memoryVerse.ref) changeStore(current=>({...current,game:{...current.game,points:current.game.points+10,rounds:current.game.rounds+1,verseRef:memoryVerse.ref}}));
    else if(correct) changeStore(current=>({...current,game:{...current.game,points:current.game.points+10,rounds:current.game.rounds+1}}));
  };
  const nextMemory=()=>{
    const options=VERSES.filter(v=>v.ref!==memoryVerse.ref);
    const next=randomItem(options);setMemoryVerse(next);
    changeStore(current=>({...current,game:{...current.game,verseRef:next.ref}}));
  };
  const exportBackup=()=>{
    const blob=new Blob([JSON.stringify({version:1,app:'Scripture Companion',exportedAt:new Date().toISOString(),store},null,2)],{type:'application/json'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='scripture-companion-backup.json';link.click();URL.revokeObjectURL(link.href);
  };
  const importBackup=async(file:File)=>{
    setImportError('');
    try {
      const parsed:unknown=JSON.parse(await file.text());
      const imported=isRecord(parsed)&&isRecord(parsed.store)?parsed.store:parsed;
      if(!validStore(imported))throw new Error('That file does not contain a valid Scripture Companion backup.');
      setStore(imported);notify('Backup restored in this browser');
    } catch(error) { setImportError(error instanceof Error?error.message:'Could not read this backup file.'); }
    if(fileInput.current)fileInput.current.value='';
  };
  const openNote=(ref:string)=>{setNoteRef(ref);setNoteDraft('');};
  const todayCount=store.progress.readingHistory.filter(item=>dayStamp(item.ts)===dayStamp(Date.now())).length;
  const percent=Math.round(store.progress.readChapterKeys.length/1189*100);
  const headerActions=(
    <div className="header-actions">
      <button className="icon-button" aria-label="Change appearance" data-testid="button-theme" onClick={()=>setPreference({theme:store.preferences.theme==='light'?'sepia':store.preferences.theme==='sepia'?'dark':'light'})}>{store.preferences.theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</button>
      <button className="button small subtle" data-testid="button-export-backup" onClick={exportBackup}><Download size={14}/> Backup</button>
      <button className="icon-button" aria-label="Import backup" data-testid="button-import-backup" onClick={()=>fileInput.current?.click()}><FileUp size={16}/></button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void importBackup(file);}} data-testid="input-import-backup"/>
    </div>
  );
  const saveActions=(verse:Verse)=>(
    <div className="quote-actions">
      <button className="button small" onClick={()=>void copyVerse(verse)} data-testid="button-copy-verse"><Copy size={14}/> Copy</button>
      <button className="button small" onClick={()=>saveVerse(verse)} data-testid="button-save-verse">
        <Heart size={14} fill={store.saved.some(item=>item.ref===verse.ref)?'currentColor':'none'}/>
        {store.saved.some(item=>item.ref===verse.ref)?'Saved':'Save verse'}
      </button>
      <button className="button small" onClick={()=>{const parsed=parseRef(verse.ref);if(parsed)changeChapter(parsed.book,parsed.chapter);}} data-testid="button-read-context"><BookOpen size={14}/> Read in context</button>
    </div>
  );
  const VerseCard=({verse,showActions=true}:{verse:Verse;showActions?:boolean})=>(
    <article className="panel quote-card reveal" data-testid={`verse-card-${verse.ref.replace(/[^a-zA-Z0-9]/g,'-')}`}>
      <div className="panel-label"><Sparkles size={14}/> {verse.category} · source collection</div>
      <blockquote className="quote-text serif">“{verse.text}”</blockquote>
      <div className="quote-ref">{verse.ref}</div>
      {showActions&&saveActions(verse)}
    </article>
  );
  const ProgressBar=({value}:{value:number})=><div className="progress-track" aria-label={`${value}% complete`}><div className="progress-fill" style={{width:`${Math.min(value,100)}%`}}/></div>;
  const Heading=()=>(
    <div className="page-heading">
      <div><p className="eyebrow">BIBLE RANDOMIZER · A PERSONAL READING SPACE</p><h1 className="page-title serif" data-testid="text-page-title">{displayTitle}</h1><p className="page-subtitle">{displaySub}</p></div>
      {view==='tracker'&&<button className="button small" onClick={exportBackup}><Download size={14}/> Export data</button>}
    </div>
  );
  const ReaderContent=()=>(
    <div className="panel reader reveal" data-testid="chapter-reader">
      <div className="reader-toolbar">
        <div className="reader-book"><BookOpen size={20} color="var(--gold)"/><div><small>{currentBook.testament}</small>{book} {chapter}</div></div>
        <div className="search-row">
          <div className="field-wrap"><Search size={15} style={{position:'absolute',left:12,top:13,color:'var(--muted-ink)'}}/><input className="field" style={{paddingLeft:35}} value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')jumpToReference();}} placeholder="Jump to a reference" aria-label="Jump to a Bible reference" data-testid="input-reference-search"/></div>
          <button className="button small" onClick={jumpToReference} data-testid="button-jump-reference">Go</button>
        </div>
      </div>
      <div className="search-row" style={{marginBottom:19}}>
        <select className="select" value={book} onChange={event=>{setBook(event.target.value);setChapter(1);}} aria-label="Choose a book" data-testid="select-book">{BOOKS.map(item=><option value={item.name} key={item.name}>{item.name}</option>)}</select>
        <select className="select" value={chapter} onChange={event=>setChapter(Number(event.target.value))} aria-label="Choose a chapter" data-testid="select-chapter">{Array.from({length:currentBook.chapterCount},(_,i)=><option key={i+1} value={i+1}>Chapter {i+1}</option>)}</select>
        <div className="chapter-controls" style={{marginLeft:'auto'}}>
          <button className="icon-button" aria-label="Previous chapter" data-testid="button-previous-chapter" onClick={()=>{if(chapter>1)setChapter(chapter-1);else if(BOOKS.indexOf(currentBook)>0){const prev=BOOKS[BOOKS.indexOf(currentBook)-1];setBook(prev.name);setChapter(prev.chapterCount);}}}><ChevronLeft size={17}/></button>
          <button className="icon-button" aria-label="Next chapter" data-testid="button-next-chapter" onClick={()=>{if(chapter<currentBook.chapterCount)setChapter(chapter+1);else if(BOOKS.indexOf(currentBook)<65){setBook(BOOKS[BOOKS.indexOf(currentBook)+1].name);setChapter(1);}}}><ChevronRight size={17}/></button>
        </div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
        <button className={`button small ${isRead?'gold':''}`} onClick={()=>toggleRead()} data-testid="button-toggle-read">{isRead?<Check size={14}/>:<CheckCheck size={14}/>} {isRead?'Read · mark unread':'Mark chapter read'}</button>
        <button className="button small" onClick={()=>toggleBookmark()} data-testid="button-toggle-bookmark"><Bookmark size={14} fill={store.bookmarks.includes(currentKey)?'currentColor':'none'}/>{store.bookmarks.includes(currentKey)?'Bookmarked':'Bookmark'}</button>
        <label className="button small" style={{position:'relative'}}><Highlighter size={14}/> Highlight color <select aria-label="Highlight color" value={highlightColor} onChange={event=>setHighlightColor(event.target.value)} style={{border:0,background:'transparent',color:'inherit',maxWidth:75}} data-testid="select-highlight-color">{COLORS.map(color=><option value={color} key={color}>{color===COLORS[0]?'Gold':color===COLORS[1]?'Sage':color===COLORS[2]?'Blue':'Rose'}</option>)}</select></label>
        <label className="button small"><Settings2 size={14}/> Text <input aria-label="Reading font size" type="range" min="18" max="30" value={store.preferences.fontSize} onChange={event=>setPreference({fontSize:Number(event.target.value)})} style={{width:70,accentColor:'var(--gold)'}} data-testid="input-reader-font-size"/></label>
      </div>
      {currentLines?<div className={`chapter-body ${store.preferences.fontFamily==='serif'?'serif':''}`} style={{'--reader-size':`${store.preferences.fontSize}px`} as CSSProperties}>
        {currentLines.map((line,index)=>{
          const ref=`${book==='Psalms'?'Psalm':book} ${chapter}:${index+1}`;
          const highlight=store.highlights.find(item=>item.ref===ref);
          return <div className="chapter-line" key={`${ref}-${index}`} onClick={()=>toggleHighlight(ref)} data-testid={`chapter-verse-${index+1}`} title="Click to highlight or remove highlight"><span className="verse-number">{index+1}</span><span>{highlight?<mark style={{background:highlight.color}}>{line}</mark>:line}</span></div>;
        })}
        <p className="footer-note">Chapter text included in the supplied source. Translation attribution was not provided with the source material.</p>
      </div>:<div className="callout" data-testid="chapter-text-unavailable"><strong>{book} {chapter} text is unavailable in this edition.</strong><br/>The supplied source includes full chapter text only for selected passages. We won’t create or approximate Scripture. You can still mark this reference as read, save it with a note, or explore another chapter.</div>}
      <div style={{borderTop:'1px solid var(--line)',marginTop:22,paddingTop:16,display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="button small" onClick={()=>openNote(currentKey)} data-testid="button-note-chapter"><NotebookPen size={14}/> Add a note</button>
        <button className="button small" onClick={()=>setView('tracker')} data-testid="button-open-tracker"><ListChecks size={14}/> Reading tracker</button>
        <button className="button small" onClick={randomChapter} data-testid="button-randomize-again"><Dices size={14}/> Another chapter</button>
      </div>
    </div>
  );

  const homeView=()=>(
    <>
      <div className="grid-main">
        <section className="feature-panel reveal" data-testid="card-random-discovery">
          <div className="panel-label" style={{color:'var(--gold-light)'}}><Dices size={14}/> Your next open page</div>
          <h2 className="feature-title serif">A little wonder<br/>for right now.</h2>
          <p className="feature-copy">A random chapter can be a good place to begin. Find a passage, read what’s available, and keep what speaks to you.</p>
          <div className="feature-actions">
            <button className="button primary" onClick={randomChapter} data-testid="button-random-chapter"><Dices size={16}/> Open a random chapter</button>
            <button className="button" onClick={()=>go('roulette')} data-testid="button-verse-roulette"><Shuffle size={15}/> Spin a verse</button>
          </div>
        </section>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <VerseCard verse={todayVerse}/>
          <section className="panel">
            <div className="panel-label"><ListChecks size={14}/> Your rhythm</div>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',margin:'15px 0 8px'}}><strong style={{fontSize:16}}>A little at a time</strong><span className="mono" style={{fontSize:11,color:'var(--gold)'}}>{percent}%</span></div>
            <ProgressBar value={percent}/>
            <div className="mini-stat"><span>Chapters read</span><strong>{store.progress.readChapterKeys.length} / 1,189</strong></div>
            <div className="mini-stat"><span>Reading streak</span><strong>{store.progress.streak} days</strong></div>
            <button className="button small" style={{marginTop:13}} onClick={()=>go('tracker')} data-testid="button-view-tracker">Open tracker <ArrowRight size={13}/></button>
          </section>
        </div>
      </div>
      <div className="section-row"><h2 className="section-title" style={{margin:0}}>A place to begin</h2><span className="panel-label">Choose the moment you need</span></div>
      <div className="topic-list">
        {[{view:'today' as View,label:'Today’s verse'},{view:'mood' as View,label:'How I feel'},{view:'topics' as View,label:'A topic to explore'},{view:'memorize' as View,label:'Practice a verse'},{view:'plan' as View,label:'A 7-day plan'}].map(item=><button className="topic-chip" key={item.view} onClick={()=>go(item.view)} data-testid={`button-shortcut-${item.view}`}>{item.label} <ArrowRight size={12} style={{verticalAlign:'middle'}}/></button>)}
      </div>
      <p className="footer-note">Your progress and saved items are stored in this browser, on this device. No account needed.</p>
    </>
  );

  const readerView=()=>(
    <>
      <div className="grid-main">
        <ReaderContent/>
        <aside style={{display:'flex',flexDirection:'column',gap:13}}>
          <div className="panel">
            <div className="panel-label"><Info size={14}/> About this book</div>
            <h2 className="section-title" style={{marginTop:15,marginBottom:5}}>{currentBook.name}</h2>
            <p style={{fontSize:12,color:'var(--muted-ink)',lineHeight:1.6,margin:'0 0 14px'}}>{currentBook.about}</p>
            <div className="mini-stat"><span>Testament</span><strong>{currentBook.testament==='Old Testament'?'Old':'New'}</strong></div>
            <div className="mini-stat"><span>Author</span><strong>{currentBook.author}</strong></div>
            <div className="mini-stat"><span>Chapters</span><strong>{currentBook.chapterCount}</strong></div>
          </div>
          <div className="panel soft"><div className="panel-label"><Highlighter size={14}/> Mark a verse</div><p style={{fontSize:12,lineHeight:1.6,color:'var(--muted-ink)',marginBottom:0}}>Tap any line in the chapter to add or remove a highlight. Pick a color above the reading text.</p></div>
          {store.bookmarks.length>0&&<div className="panel"><div className="panel-label"><Bookmark size={14}/> Bookmarks</div>{store.bookmarks.slice(0,4).map(key=><button key={key} className="mini-stat" style={{width:'100%',border:0,background:'transparent',cursor:'pointer',textAlign:'left'}} onClick={()=>{const parsed=parseRef(key);if(parsed)changeChapter(parsed.book,parsed.chapter);}} data-testid={`button-bookmark-${key.replaceAll(' ','-')}`}>{key}<ArrowRight size={13}/></button>)}</div>}
        </aside>
      </div>
    </>
  );

  const rouletteView=()=>(
    <div className="grid-main">
      <section>
        <div className="panel-label" style={{margin:'5px 0 12px'}}><Shuffle size={14}/> {topic==='All topics'?'All curated verses':topic}</div>
        <VerseCard verse={rouletteVerse}/>
        <div className="feature-actions" style={{marginTop:14}}>
          <button className="button primary" onClick={spinVerse} data-testid="button-spin-verse"><Dices size={15}/> Another verse</button>
          <button className="button" onClick={()=>{const index=VERSES.indexOf(rouletteVerse);setRouletteVerse(VERSES[(index-1+VERSES.length)%VERSES.length]);}} data-testid="button-previous-verse"><ArrowLeft size={14}/> Previous in collection</button>
        </div>
      </section>
      <section className="panel">
        <div className="panel-label"><Library size={14}/> Choose a topic</div>
        <div className="topic-list" style={{marginTop:17}}>
          <button className={`topic-chip ${topic==='All topics'?'selected':''}`} onClick={()=>setTopic('All topics')} data-testid="button-topic-all">All topics</button>
          {TOPICS.map(item=><button key={item} className={`topic-chip ${topic===item?'selected':''}`} onClick={()=>{setTopic(item);const pool=VERSES.filter(v=>v.category.toLowerCase()===item.toLowerCase());if(pool.length)setRouletteVerse(randomItem(pool));}} data-testid={`button-topic-${item.toLowerCase()}`}>{item}<span style={{opacity:.6}}> · {VERSES.filter(v=>v.category===item).length}</span></button>)}
        </div>
        <p className="footer-note">Topics reflect the categories present in the supplied verse collection. Some categories contain a single verse.</p>
      </section>
    </div>
  );

  const topicsView=()=>(
    <>
      <div className="panel">
        <div className="panel-label"><Search size={14}/> Find a theme</div>
        <p style={{fontSize:12,color:'var(--muted-ink)',lineHeight:1.6}}>Choose a theme to see the exact verses included in this source collection.</p>
        <div className="topic-list">{TOPICS.map(item=><button key={item} className={`topic-chip ${topic===item?'selected':''}`} onClick={()=>setTopic(item)} data-testid={`button-topic-browse-${item.toLowerCase()}`}>{item} <span style={{opacity:.65}}>({VERSES.filter(v=>v.category===item).length})</span></button>)}</div>
      </div>
      <div className="section-row"><h2 className="section-title" style={{margin:0}}>{topic==='All topics'?'Featured verses':topic}</h2><button className="button small" onClick={()=>{setTopic('All topics');go('roulette');}} data-testid="button-browse-roulette"><Shuffle size={13}/> Verse roulette</button></div>
      <div className="grid-main">{(topic==='All topics'?VERSES:VERSES.filter(v=>v.category===topic)).map(verse=><VerseCard key={verse.ref} verse={verse}/>)}</div>
      {topic!=='All topics'&&!VERSES.some(v=>v.category===topic)&&<div className="empty-state"><Sparkles size={19}/><h3>No verse in this category yet</h3><p>The original source lists this theme, but its curated passage list is not included.</p><button className="button small" onClick={()=>setTopic('All topics')}>Show all available verses</button></div>}
    </>
  );

  const todayView=()=>(
    <div className="grid-main">
      <div><VerseCard verse={todayVerse}/><div className="callout" style={{marginTop:13}}>Today’s selection rotates through the verses supplied with this app. It is a reading prompt, not a new translation.</div></div>
      <div className="panel">
        <div className="panel-label"><Sparkles size={14}/> A quiet prompt</div>
        <h2 className="serif" style={{fontSize:29,fontWeight:400,lineHeight:1.15,margin:'20px 0 11px'}}>What word would you like to carry with you?</h2>
        <p style={{fontSize:13,color:'var(--muted-ink)',lineHeight:1.65}}>Take a breath. Read the verse once, then read it again a little more slowly. Keep only what is helpful.</p>
        <button className="button" onClick={()=>go('memorize')} data-testid="button-practice-today"><Target size={14}/> Practice this verse</button>
      </div>
    </div>
  );

  const moodView=()=>(
    <div className="grid-main">
      <section className="panel">
        <div className="panel-label"><Heart size={14}/> Begin with how you feel</div>
        <div className="mood-grid" style={{marginTop:18}}>
          {MOODS.map((item,index)=><button className={`mood-button ${mood===item.name?'selected':''}`} key={item.name} onClick={()=>startMood(item.name)} data-testid={`button-mood-${item.name.toLowerCase().replaceAll(' ','-')}`}><span style={{fontSize:11,fontFamily:'var(--app-font-mono)',color:'var(--gold)'}}>0{index+1}</span><br/>{item.name}</button>)}
        </div>
        <div className="callout" style={{marginTop:17}}>{MOODS.find(item=>item.name===mood)?.prompt}</div>
        <button className="button primary" style={{marginTop:16}} onClick={()=>startMood(mood)} data-testid="button-mood-another"><RotateCcw size={14}/> Another passage</button>
      </section>
      <VerseCard verse={moodVerse}/>
    </div>
  );

  const memoryView=()=>(
    <div className="grid-main">
      <section className="panel">
        <div className="panel-label"><Target size={14}/> Word-order challenge</div>
        <h2 className="section-title" style={{marginTop:16}}>Put the verse back in order</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:15}}>{(['Gentle','Steady','Stretch'] as const).map(level=><button key={level} className={`topic-chip ${memoryDifficulty===level?'selected':''}`} onClick={()=>setMemoryDifficulty(level)} data-testid={`button-memory-level-${level.toLowerCase()}`}>{level}</button>)}</div>
        <p className="quote-ref">{memoryVerse.ref}</p>
        <div className="memory-line" aria-label="Verse word slots" data-testid="memory-answer-slots">
          {words.map((word,index)=><button key={`${index}-${word}`} className="memory-slot" onClick={()=>{const next=[...memoryOrder];next[index]='';setMemoryOrder(next);setMemoryResult('');}} disabled={!hiddenIndexes.has(index)} data-testid={`memory-slot-${index}`}>{hiddenIndexes.has(index)?memoryOrder[index]||'·':word}</button>)}
        </div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',padding:'14px 0',borderTop:'1px solid var(--line)'}}>
          {words.map((word,index)=>hiddenIndexes.has(index)&&!memoryOrder.includes(word)&&<button className="memory-word" key={`${word}-${index}`} onClick={()=>{const empty=words.findIndex((_,slot)=>hiddenIndexes.has(slot)&&!memoryOrder[slot]);if(empty>=0){const next=[...memoryOrder];next[empty]=word;setMemoryOrder(next);setMemoryResult('');}}} data-testid={`memory-word-${index}`}>{word}</button>)}
        </div>
        <p aria-live="polite" style={{fontSize:12,color:memoryResult.startsWith('Exactly')?'var(--gold)':'var(--muted-ink)',minHeight:19}} data-testid="text-memory-result">{memoryResult}</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="button primary" onClick={checkMemory} data-testid="button-check-memory"><Check size={14}/> Check my order</button>
          <button className="button" onClick={()=>{setMemoryOrder([]);setMemoryResult('');}} data-testid="button-reset-memory"><RotateCcw size={14}/> Reset</button>
          <button className="button" onClick={nextMemory} data-testid="button-next-memory">New verse <ArrowRight size={14}/></button>
        </div>
      </section>
      <div><VerseCard verse={memoryVerse}/><div className="panel" style={{marginTop:12}}><div className="panel-label"><Target size={14}/> Practice record</div><div className="mini-stat"><span>Points</span><strong>{store.game.points}</strong></div><div className="mini-stat"><span>Rounds checked</span><strong>{store.game.rounds}</strong></div><p className="footer-note">Your challenge progress is stored on this device.</p></div></div>
    </div>
  );

  const trackerView=()=>(
    <>
      <div className="tracker-summary">
        <div className="summary-cell"><div className="summary-value">{store.progress.readChapterKeys.length}</div><div className="summary-label">chapters read of 1,189</div></div>
        <div className="summary-cell"><div className="summary-value">{store.progress.streak}</div><div className="summary-label">day reading streak</div></div>
        <div className="summary-cell"><div className="summary-value">{todayCount}</div><div className="summary-label">chapters read today</div></div>
        <div className="summary-cell"><div className="summary-value">{percent}%</div><div className="summary-label">of the Bible explored</div></div>
      </div>
      <div className="panel">
        <div className="section-row" style={{marginTop:0}}><div><div className="panel-label"><Target size={14}/> Daily reading goal</div><p style={{fontSize:12,color:'var(--muted-ink)',marginBottom:0}}>Choose a goal that fits your day.</p></div>
          <select className="select" value={store.progress.dailyGoal} onChange={event=>changeStore(current=>({...current,progress:{...current.progress,dailyGoal:Number(event.target.value)}}))} data-testid="select-daily-goal"><option value="1">1 chapter / day</option><option value="2">2 chapters / day</option><option value="3">3 chapters / day</option><option value="5">5 chapters / day</option></select>
        </div>
        <ProgressBar value={Math.min(100,todayCount/store.progress.dailyGoal*100)}/>
        <div className="section-row"><h2 className="section-title" style={{margin:0}}>All 66 books</h2><select className="select" value={testament} onChange={event=>setTestament(event.target.value as typeof testament)} aria-label="Filter books" data-testid="select-testament"><option>All books</option><option>Old Testament</option><option>New Testament</option></select></div>
        <div className="book-grid">
          {filteredBooks.map(item=>{
            const read=store.progress.readChapterKeys.filter(key=>key.startsWith(`${item.name} `)).length;
            const expanded=openBook===item.name;
            return <div key={item.name} style={{gridColumn:expanded?'1 / -1':undefined}}>
              <button className="book-row" style={{width:'100%'}} onClick={()=>setOpenBook(expanded?null:item.name)} aria-expanded={expanded} data-testid={`button-book-${item.name.toLowerCase().replaceAll(' ','-')}`}><span className={`book-dot ${read===item.chapterCount?'done':''}`}/><span style={{minWidth:0,flex:1}}><span className="book-title" style={{display:'block'}}>{item.name}</span><span className="book-meta">{read} / {item.chapterCount} chapters</span><ProgressBar value={read/item.chapterCount*100}/></span><ChevronDown size={13} style={{transform:expanded?'rotate(180deg)':'none'}}/></button>
              {expanded&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(40px,1fr))',gap:6,padding:'10px 2px'}}>{Array.from({length:item.chapterCount},(_,index)=>{const key=`${item.name} ${index+1}`;const checked=store.progress.readChapterKeys.includes(key);return <button key={key} className={`button small ${checked?'gold':''}`} style={{padding:0}} onClick={()=>{toggleRead(key);changeChapter(item.name,index+1);}} data-testid={`button-mark-${item.name.toLowerCase().replaceAll(' ','-')}-${index+1}`} aria-label={`${checked?'Mark unread':'Mark read'} ${key}`}>{checked?<Check size={12}/>:index+1}</button>;})}</div>}
            </div>;
          })}
        </div>
      </div>
      <div className="section-row"><h2 className="section-title" style={{margin:0}}>Recent reading</h2><button className="button small" onClick={()=>changeStore(current=>({...current,progress:{...current.progress,readingHistory:[],streak:0,readChapterKeys:[]}}))} data-testid="button-reset-progress"><RotateCcw size={13}/> Reset tracker</button></div>
      {store.progress.readingHistory.length?<div className="panel list-card">{[...store.progress.readingHistory].reverse().slice(0,8).map(entry=><button className="mini-stat" key={`${entry.key}-${entry.ts}`} style={{width:'100%',background:'transparent',textAlign:'left',border:0,cursor:'pointer'}} onClick={()=>{const parsed=parseRef(entry.key);if(parsed)changeChapter(parsed.book,parsed.chapter);}} data-testid={`row-history-${entry.key.replaceAll(' ','-')}`}><span>{entry.key}</span><strong>{new Date(entry.ts).toLocaleDateString()}</strong></button>)}</div>:<div className="empty-state"><BookOpen size={20}/><h3>Your reading history begins here</h3><p>Mark a chapter as read and it will appear in this private record.</p><button className="button small" onClick={()=>go('reader')}>Open a chapter</button></div>}
      <p className="footer-note">Tracker data and reading history are saved in this browser. You can export a backup at any time.</p>
    </>
  );

  const savedView=()=>(
    <>
      <div className="section-row" style={{marginTop:0}}><div><h2 className="section-title" style={{marginBottom:5}}>Saved verses</h2><span className="panel-label">{store.saved.length} saved locally</span></div><button className="button small" onClick={exportBackup} data-testid="button-export-saved"><Download size={13}/> Back up</button></div>
      {store.saved.length? <div className="list-card">{store.saved.map(verse=>{
        const note=store.notes.find(item=>item.ref===verse.ref);
        return <article className="saved-item" key={verse.ref} style={{'--saved-color':verse.color} as CSSProperties} data-testid={`saved-verse-${verse.ref.replace(/[^a-zA-Z0-9]/g,'-')}`}>
          <p className="serif">“{verse.text}”</p>
          <div className="saved-meta"><span>{verse.ref} · {verse.category}</span><div style={{display:'flex',gap:5}}><button className="icon-button" aria-label={`Add note to ${verse.ref}`} onClick={()=>openNote(verse.ref)} data-testid={`button-add-note-${verse.ref.replace(/[^a-zA-Z0-9]/g,'-')}`}><NotebookPen size={14}/></button><button className="icon-button" aria-label={`Remove ${verse.ref}`} onClick={()=>saveVerse(verse)} data-testid={`button-remove-saved-${verse.ref.replace(/[^a-zA-Z0-9]/g,'-')}`}><Trash2 size={14}/></button></div></div>
          {note&&<div className="note-card"><div className="panel-label"><NotebookPen size={12}/> Your note</div><p style={{margin:'6px 0 8px'}}>{note.text}</p><button className="button small" onClick={()=>deleteNote(note.id)} data-testid={`button-delete-note-${note.id}`}><Trash2 size={12}/> Delete note</button></div>}
          <div style={{display:'flex',gap:5,marginTop:10,alignItems:'center'}}><span style={{fontSize:10,color:'var(--muted-ink)'}}>Mark color</span>{COLORS.map(color=><button key={color} aria-label={`Use color ${color}`} onClick={()=>changeStore(current=>({...current,saved:current.saved.map(item=>item.ref===verse.ref?{...item,color}:item)}))} style={{width:17,height:17,borderRadius:'50%',background:color,border:verse.color===color?'2px solid var(--ink)':'1px solid var(--line)'}} data-testid={`button-color-${verse.ref.replace(/[^a-zA-Z0-9]/g,'-')}-${COLORS.indexOf(color)}`}/>)}</div>
        </article>;
      })}</div>:<div className="empty-state"><Bookmark size={20}/><h3>Nothing saved yet</h3><p>When a verse feels worth keeping, save it here. Your collection stays on this device.</p><button className="button small" onClick={()=>go('roulette')}>Find a verse</button></div>}
      {store.notes.some(item=>!store.saved.some(verse=>verse.ref===item.ref))&&<section style={{marginTop:24}}><h2 className="section-title">Other notes</h2><div className="list-card">{store.notes.filter(item=>!store.saved.some(verse=>verse.ref===item.ref)).map(note=><article className="panel" key={note.id}><div className="saved-meta"><span>{note.ref}</span><button className="icon-button" aria-label="Delete note" onClick={()=>deleteNote(note.id)} data-testid={`button-delete-note-${note.id}`}><Trash2 size={14}/></button></div><p style={{fontSize:13,lineHeight:1.6}}>{note.text}</p><span className="panel-label">{new Date(note.date).toLocaleDateString()}</span></article>)}</div></section>}
      <div className="section-row"><h2 className="section-title" style={{margin:0}}>Chapter bookmarks</h2></div>
      {store.bookmarks.length?<div className="topic-list">{store.bookmarks.map(key=><button className="topic-chip" key={key} onClick={()=>{const parsed=parseRef(key);if(parsed)changeChapter(parsed.book,parsed.chapter);}} data-testid={`button-open-saved-bookmark-${key.replaceAll(' ','-')}`}><Bookmark size={12}/> {key}</button>)}</div>:<p className="footer-note">Bookmark a chapter from the reader to keep it close.</p>}
    </>
  );

  const planView=()=>(
    <div className="grid-main">
      <section className="panel">
        <div className="panel-label"><Target size={14}/> A one-week path</div>
        <p style={{fontSize:12,color:'var(--muted-ink)',lineHeight:1.6}}>Seven short readings from the supplied plan. Open any reading to see if its chapter text is included in this edition.</p>
        {PLAN.map(item=><div key={item.day} className={`plan-row ${store.planDone.includes(item.day)?'completed':''}`} data-testid={`plan-row-${item.day}`}>
          <div className="plan-day">{store.planDone.includes(item.day)?<Check size={14}/>:item.day}</div>
          <button onClick={()=>selectPlan(item.ref)} style={{textAlign:'left',background:'transparent',border:0,color:'var(--ink)',padding:0}} data-testid={`button-open-plan-day-${item.day}`}><h4>{item.title} <span className="mono" style={{fontSize:10,color:'var(--gold)'}}>· {item.ref}</span></h4><p>{item.note}</p></button>
          <button className="button small" onClick={()=>markPlan(item.day)} data-testid={`button-toggle-plan-day-${item.day}`}>{store.planDone.includes(item.day)?'Done':'Mark done'}</button>
        </div>)}
        <button className="button small" style={{marginTop:14}} onClick={()=>changeStore(current=>({...current,planDone:current.planDone.length===7?[]:PLAN.map(item=>item.day)}))} data-testid="button-toggle-all-plan">{store.planDone.length===7?'Reset plan':'Mark all complete'}</button>
      </section>
      <section className="panel soft"><div className="panel-label"><Sparkles size={14}/> Keep it gentle</div><h2 className="serif" style={{fontSize:30,lineHeight:1.05,fontWeight:400,margin:'18px 0 10px'}}>There is no catching up.</h2><p style={{fontSize:13,lineHeight:1.7,color:'var(--muted-ink)'}}>A reading plan is an invitation, not a test. Return to any day, skip a day, or start over when it feels right.</p><button className="button" onClick={()=>go('tracker')} data-testid="button-plan-tracker">See my tracker <ArrowRight size={14}/></button></section>
    </div>
  );

  const infoView=()=>{
    const titles:Record<string,string>={how:'How it works',about:'About Bible Randomizer',privacy:'Privacy, in plain language',contact:'Contact'};
    return <div className="grid-main">
      <article className="panel" style={{gridColumn:'1 / -1',maxWidth:870}}>
        <div className="panel-label"><Info size={14}/> {titles[view]}</div>
        {view==='how'&&<div style={{fontSize:14,lineHeight:1.8,marginTop:16}}><h2 className="serif" style={{fontWeight:400,fontSize:34}}>Start small. Stay curious.</h2><p>Choose a random chapter, spin a verse, or browse by topic. Read what is available, save a line, and leave yourself a note when you want to remember why it mattered.</p><h3>Reading tracker</h3><p>Mark chapters as read and set a daily goal that fits your life. The tracker is yours to reset or export at any time.</p><h3>About chapter text</h3><p>The original source includes full chapter text for selected passages only. When a requested chapter is not included, the reader identifies it as unavailable rather than filling the gap with generated or invented Scripture.</p><h3>Where your data lives</h3><p>Preferences, reading progress, bookmarks, saved verses, notes, highlights, and game progress are saved in local storage on this browser. There is no sign-in and no server connection.</p></div>}
        {view==='about'&&<div style={{fontSize:14,lineHeight:1.8,marginTop:16}}><h2 className="serif" style={{fontWeight:400,fontSize:34}}>An open page for an ordinary day.</h2><p>Bible Randomizer is a personal Scripture companion for people who want a small, unexpected moment of reading and reflection. The aim is simple: make it easy to return, without pressure to read perfectly or keep a streak alive.</p><p>The curated verses, chapter excerpts, book descriptions, and seven-day plan come from the supplied source material. This app does not create Bible quotations.</p></div>}
        {view==='privacy'&&<div style={{fontSize:14,lineHeight:1.8,marginTop:16}}><h2 className="serif" style={{fontWeight:400,fontSize:34}}>Your reading stays yours.</h2><p>This first version has no account or backend. Your preferences, reading progress, saved verses, notes, highlights, bookmarks, and memorization score are stored in this browser using localStorage.</p><p>Clearing browser storage may erase this data. Use Backup to export a JSON copy, and Import to restore it. Import replaces the data currently in this browser only after the file passes validation.</p><p>No analytics, tracking pixels, or third-party API requests are part of this frontend.</p></div>}
        {view==='contact'&&<div style={{fontSize:14,lineHeight:1.8,marginTop:16}}><h2 className="serif" style={{fontWeight:400,fontSize:34}}>A note is welcome.</h2><p>Send ideas or questions to the project team:</p><a href="mailto:contact@biblerandomizer.com" style={{color:'var(--gold)',fontWeight:700}} data-testid="link-contact-email">contact@biblerandomizer.com</a><p className="footer-note">This is a mail link; opening it depends on the email app configured on your device.</p></div>}
        <div style={{borderTop:'1px solid var(--line)',paddingTop:19,marginTop:25}}>
          <div className="panel-label"><Settings2 size={14}/> Reading preferences</div>
          <div className="search-row" style={{marginTop:13}}>
            <label style={{fontSize:12}}>Color mood <select className="select" style={{marginLeft:8}} value={store.preferences.theme} onChange={event=>setPreference({theme:event.target.value as Theme})} data-testid="select-theme"><option value="light">Soft parchment</option><option value="sepia">Warm sepia</option><option value="dark">Evening</option></select></label>
            <label style={{fontSize:12}}>Reading type <select className="select" style={{marginLeft:8}} value={store.preferences.fontFamily} onChange={event=>setPreference({fontFamily:event.target.value as Preferences['fontFamily']})} data-testid="select-font-family"><option value="serif">Serif</option><option value="sans">Sans serif</option></select></label>
            <label style={{fontSize:12}}>Text size <input type="range" min="18" max="30" value={store.preferences.fontSize} onChange={event=>setPreference({fontSize:Number(event.target.value)})} data-testid="input-preference-font-size"/></label>
          </div>
        </div>
      </article>
      <section className="panel"><div className="panel-label"><Download size={14}/> Browser backup</div><p style={{fontSize:12,lineHeight:1.6,color:'var(--muted-ink)'}}>Export your local data to a JSON file, or restore an earlier copy. Imports are validated before replacing your current data.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button small" onClick={exportBackup} data-testid="button-info-export"><Download size={13}/> Export backup</button><button className="button small" onClick={()=>fileInput.current?.click()} data-testid="button-info-import"><FileUp size={13}/> Import backup</button></div>{importError&&<p role="alert" style={{color:'var(--destructive)',fontSize:12}} data-testid="text-import-error">{importError}</p>}</section>
    </div>;
  };

  return (
    <div className={`app-shell ${store.preferences.fontFamily==='sans'?'font-sans-mode':''}`} data-testid="app-shell">
      <header className="site-header">
        <button className="brand" onClick={()=>go('home')} data-testid="button-home-brand" style={{border:0,background:'transparent',padding:0,textAlign:'left'}}>
          <span className="brand-mark"><BookOpen size={20}/></span><span><span className="brand-name">Bible Randomizer</span><span className="brand-tag">A pause for the words that matter</span></span>
        </button>
        {headerActions}
      </header>
      <div className="app-layout">
        <aside className="side-nav" aria-label="Main navigation">
          {NAV.map(section=><div key={section.section}><div className="nav-section">{section.section}</div>{section.items.map(item=><button key={item.view} className={`nav-item ${view===item.view?'active':''}`} onClick={()=>go(item.view)} data-testid={`nav-${item.view}`}><item.icon size={16}/>{item.label}{item.view==='saved'&&store.saved.length>0&&<span className="nav-count">{store.saved.length}</span>}</button>)}</div>)}
          <p className="footer-note">Your data is saved in this browser.</p>
        </aside>
        <main className="content">
          <Heading/>
          {view==='home'&&homeView()}
          {view==='reader'&&readerView()}
          {view==='roulette'&&rouletteView()}
          {view==='topics'&&topicsView()}
          {view==='today'&&todayView()}
          {view==='mood'&&moodView()}
          {view==='memorize'&&memoryView()}
          {view==='tracker'&&trackerView()}
          {view==='saved'&&savedView()}
          {view==='plan'&&planView()}
          {['how','about','privacy','contact'].includes(view)&&infoView()}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation" data-testid="mobile-navigation">
        {[{view:'home' as View,label:'Home',icon:BookOpen},{view:'reader' as View,label:'Read',icon:Dices},{view:'roulette' as View,label:'Verse',icon:Shuffle},{view:'tracker' as View,label:'Tracker',icon:ListChecks},{view:'saved' as View,label:'Saved',icon:Bookmark},{view:'plan' as View,label:'Plan',icon:Target}].map(item=><button className={`nav-item ${view===item.view?'active':''}`} key={item.view} onClick={()=>go(item.view)} data-testid={`mobile-nav-${item.view}`}><item.icon size={15}/>{item.label}</button>)}
      </nav>
      {noteRef&&<div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setNoteRef(null);}}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title">
          <div className="modal-head"><div><h2 id="note-dialog-title">A note for {noteRef}</h2><p>Private to this browser. Add a thought you want to remember.</p></div><button className="icon-button" aria-label="Close note dialog" onClick={()=>setNoteRef(null)} data-testid="button-close-note"><X size={16}/></button></div>
          <textarea className="field" value={noteDraft} onChange={event=>setNoteDraft(event.target.value)} placeholder="What would you like to remember?" autoFocus data-testid="input-note-text"/>
          <div style={{display:'flex',justifyContent:'end',gap:8,marginTop:15}}><button className="button" onClick={()=>setNoteRef(null)} data-testid="button-cancel-note">Cancel</button><button className="button primary" onClick={()=>addNote(noteRef)} data-testid="button-save-note"><NotebookPen size={14}/> Save note</button></div>
        </section>
      </div>}
      {importError&&<div role="alert" className="toast" style={{background:'var(--destructive)'}} data-testid="text-import-error-toast">{importError}<button style={{marginLeft:10,border:0,background:'transparent',color:'inherit'}} onClick={()=>setImportError('')} aria-label="Dismiss import error"><X size={13}/></button></div>}
      {toast&&<div className="toast" role="status" aria-live="polite" data-testid="status-toast">{toast}</div>}
    </div>
  );
}
