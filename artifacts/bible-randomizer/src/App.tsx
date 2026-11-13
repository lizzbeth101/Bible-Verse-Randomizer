import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, ChevronRight, Copy, Dices, Flame, Heart, Highlighter, History, Info, Lightbulb, Mic, Moon, NotebookPen, Play, RefreshCw, Search, Shuffle, Sparkles, Star, Sun, Target, Trophy, Volume2, X, Zap } from "lucide-react";

function ProperCross({size=20, color="var(--gold2)"}:{size?:number; color?:string}){
  // A proper Christian cross: vertical beam ~124 tall, horizontal beam 80 wide
  // (~65% of the vertical height), centred ~1/3 down from the top, with far
  // more vertical beam below the crossbar than above it. Rounded ends.
  return (
    <svg width={size} height={size*1.36} viewBox="0 0 100 136" fill="none" role="img" aria-label="Christian cross" style={{display:"block",flexShrink:0}}>
      <rect x="42" y="6" width="16" height="124" rx="8" fill={color}/>
      <rect x="10" y="36" width="80" height="16" rx="8" fill={color}/>
    </svg>
  );
}

type Theme="light"|"sepia"|"dark";
type Tab="random"|"verse"|"today"|"mood"|"memorize"|"saved"|"topics"|"how"|"about"|"contact"|"privacy"|"terms";
type Verse={text:string; ref:string; cat:string};
type Note={id:string; ref:string; text:string; date:string};
type Highlight={ref:string; color:string};

// ---------- LOCAL PERSISTENCE ----------
type LocalRecord={id:string; collection:string; value:any};
const LOCAL_RECORDS_KEY="bible-randomizer-records-v1";
function readLocalRecords():LocalRecord[]{
  try{
    const value=JSON.parse(window.localStorage.getItem(LOCAL_RECORDS_KEY)||"[]");
    return Array.isArray(value)?value.filter((record:any)=>record&&typeof record.id==="string"&&typeof record.collection==="string"):[];
  }catch{return []}
}
function writeLocalRecords(records:LocalRecord[]){
  window.localStorage.setItem(LOCAL_RECORDS_KEY,JSON.stringify(records));
}
async function api(action:string, args:any):Promise<any>{
  const records=readLocalRecords();
  if(action==="records.list") return {records:records.filter(record=>record.collection===args.collection)};
  if(action==="records.create"){
    const existing=records.find(record=>record.collection===args.collection);
    if(existing) return existing;
    const record={id:`${args.collection}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,collection:args.collection,value:args.value};
    writeLocalRecords([...records,record]);
    return record;
  }
  if(action==="records.replace"){
    const index=records.findIndex(record=>record.collection===args.collection&&record.id===args.id);
    if(index<0) throw new Error("Saved data could not be found in this browser.");
    const updated={...records[index],value:args.value};
    records[index]=updated;
    writeLocalRecords(records);
    return updated;
  }
  throw new Error(`Unsupported local action: ${action}`);
}
async function loadColl(coll:string){
  try{ const d=await api("records.list",{collection:coll}); return d.records?.[0]||null; }catch{return null}
}

// ---------- BIBLE DATA ----------
const BOOKS:{name:string;test:"Old"|"New";chapters:number;author:string;about:string}[]=[
{name:"Genesis",test:"Old",chapters:50,author:"Moses",about:"Beginnings — creation, covenant, and promise."},
{name:"Exodus",test:"Old",chapters:40,author:"Moses",about:"Freedom from Egypt and the covenant at Sinai."},
{name:"Leviticus",test:"Old",chapters:27,author:"Moses",about:"Holiness, worship, and life with God."},
{name:"Numbers",test:"Old",chapters:36,author:"Moses",about:"Wilderness journey and faithful guidance."},
{name:"Deuteronomy",test:"Old",chapters:34,author:"Moses",about:"A second telling of the Law before entering the land."},
{name:"Joshua",test:"Old",chapters:24,author:"Joshua",about:"Courage and entering the promised land."},
{name:"Judges",test:"Old",chapters:21,author:"Samuel",about:"Cycles of rescue and the need for a King."},
{name:"Ruth",test:"Old",chapters:4,author:"Samuel",about:"Loyalty, kindness, and redemption."},
{name:"1 Samuel",test:"Old",chapters:31,author:"Samuel",about:"Kings, calling, and a heart after God."},
{name:"2 Samuel",test:"Old",chapters:24,author:"Nathan / Gad",about:"David’s reign, failure, and grace."},
{name:"1 Kings",test:"Old",chapters:22,author:"Jeremiah",about:"Solomon, division, and prophets."},
{name:"2 Kings",test:"Old",chapters:25,author:"Jeremiah",about:"Exile and God’s persistent faithfulness."},
{name:"1 Chronicles",test:"Old",chapters:29,author:"Ezra",about:"David’s line and worship restored."},
{name:"2 Chronicles",test:"Old",chapters:36,author:"Ezra",about:"Kings and the temple."},
{name:"Ezra",test:"Old",chapters:10,author:"Ezra",about:"Return, rebuilding, and renewal."},
{name:"Nehemiah",test:"Old",chapters:13,author:"Nehemiah",about:"Rebuilding walls and hearts."},
{name:"Esther",test:"Old",chapters:10,author:"Mordecai",about:"Courage for such a time as this."},
{name:"Job",test:"Old",chapters:42,author:"Job / Elihu",about:"Suffering, mystery, and trust."},
{name:"Psalms",test:"Old",chapters:150,author:"David & others",about:"Songs for every human season."},
{name:"Proverbs",test:"Old",chapters:31,author:"Solomon",about:"Everyday wisdom for life."},
{name:"Ecclesiastes",test:"Old",chapters:12,author:"Solomon",about:"Meaning beyond what fades."},
{name:"Song of Solomon",test:"Old",chapters:8,author:"Solomon",about:"Love, longing, and delight."},
{name:"Isaiah",test:"Old",chapters:66,author:"Isaiah",about:"Judgment and astonishing comfort."},
{name:"Jeremiah",test:"Old",chapters:52,author:"Jeremiah",about:"A prophet who wept and hoped."},
{name:"Lamentations",test:"Old",chapters:5,author:"Jeremiah",about:"Grief held honestly before God."},
{name:"Ezekiel",test:"Old",chapters:48,author:"Ezekiel",about:"Dry bones and new life."},
{name:"Daniel",test:"Old",chapters:12,author:"Daniel",about:"Faithfulness in exile."},
{name:"Hosea",test:"Old",chapters:14,author:"Hosea",about:"Relentless, redeeming love."},
{name:"Joel",test:"Old",chapters:3,author:"Joel",about:"The Spirit poured out."},
{name:"Amos",test:"Old",chapters:9,author:"Amos",about:"Let justice roll like a river."},
{name:"Obadiah",test:"Old",chapters:1,author:"Obadiah",about:"Pride humbled; God reigns."},
{name:"Jonah",test:"Old",chapters:4,author:"Jonah",about:"Mercy wider than we expect."},
{name:"Micah",test:"Old",chapters:7,author:"Micah",about:"Act justly, love mercy, walk humbly."},
{name:"Nahum",test:"Old",chapters:3,author:"Nahum",about:"God defends the oppressed."},
{name:"Habakkuk",test:"Old",chapters:3,author:"Habakkuk",about:"Trust when answers are slow."},
{name:"Zephaniah",test:"Old",chapters:3,author:"Zephaniah",about:"The Lord rejoices over you."},
{name:"Haggai",test:"Old",chapters:2,author:"Haggai",about:"Rebuild with God’s presence."},
{name:"Zechariah",test:"Old",chapters:14,author:"Zechariah",about:"Visions of restoration."},
{name:"Malachi",test:"Old",chapters:4,author:"Malachi",about:"Return to the Lord."},
{name:"Matthew",test:"New",chapters:28,author:"Matthew",about:"Jesus, the promised King."},
{name:"Mark",test:"New",chapters:16,author:"Mark",about:"Jesus, the servant who acts."},
{name:"Luke",test:"New",chapters:24,author:"Luke",about:"Jesus, friend of the overlooked."},
{name:"John",test:"New",chapters:21,author:"John",about:"Believe — and have life."},
{name:"Acts",test:"New",chapters:28,author:"Luke",about:"The Spirit sends the church out."},
{name:"Romans",test:"New",chapters:16,author:"Paul",about:"Grace, faith, and new life."},
{name:"1 Corinthians",test:"New",chapters:16,author:"Paul",about:"Love in a divided church."},
{name:"2 Corinthians",test:"New",chapters:13,author:"Paul",about:"Strength in weakness."},
{name:"Galatians",test:"New",chapters:6,author:"Paul",about:"Freedom in Christ."},
{name:"Ephesians",test:"New",chapters:6,author:"Paul",about:"One new people in Christ."},
{name:"Philippians",test:"New",chapters:4,author:"Paul",about:"Joy even in chains."},
{name:"Colossians",test:"New",chapters:3,author:"Paul",about:"Christ is all."},
{name:"1 Thessalonians",test:"New",chapters:5,author:"Paul",about:"Hope for Christ’s return."},
{name:"2 Thessalonians",test:"New",chapters:3,author:"Paul",about:"Stand firm."},
{name:"1 Timothy",test:"New",chapters:6,author:"Paul",about:"Healthy teaching, healthy church."},
{name:"2 Timothy",test:"New",chapters:4,author:"Paul",about:"Finish the race well."},
{name:"Titus",test:"New",chapters:3,author:"Paul",about:"Grace that trains us."},
{name:"Philemon",test:"New",chapters:1,author:"Paul",about:"Forgiveness and brotherhood."},
{name:"Hebrews",test:"New",chapters:13,author:"Unknown",about:"Jesus is better."},
{name:"James",test:"New",chapters:5,author:"James",about:"Faith that works."},
{name:"1 Peter",test:"New",chapters:5,author:"Peter",about:"Hope in suffering."},
{name:"2 Peter",test:"New",chapters:3,author:"Peter",about:"Grow in grace."},
{name:"1 John",test:"New",chapters:5,author:"John",about:"God is love."},
{name:"2 John",test:"New",chapters:1,author:"John",about:"Walk in truth and love."},
{name:"3 John",test:"New",chapters:1,author:"John",about:"Hospitality and truth."},
{name:"Jude",test:"New",chapters:1,author:"Jude",about:"Contend for the faith."},
{name:"Revelation",test:"New",chapters:22,author:"John",about:"The Lamb wins; all is made new."},
];
const VERSES:Verse[]=[
{text:"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",ref:"John 3:16",cat:"Love"},
{text:"The Lord is my shepherd, I lack nothing.",ref:"Psalm 23:1",cat:"Comfort"},
{text:"I can do all this through him who gives me strength.",ref:"Philippians 4:13",cat:"Strength"},
{text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",ref:"Jeremiah 29:11",cat:"Hope"},
{text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",ref:"Proverbs 3:5–6",cat:"Guidance"},
{text:"Be still, and know that I am God.",ref:"Psalm 46:10",cat:"Peace"},
{text:"And we know that in all things God works for the good of those who love him.",ref:"Romans 8:28",cat:"Hope"},
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
{text:"Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",ref:"1 Corinthians 13:4",cat:"Love"},
{text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",ref:"Psalm 34:18",cat:"Comfort"},
{text:"Cast all your anxiety on him because he cares for you.",ref:"1 Peter 5:7",cat:"Peace"},
{text:"But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",ref:"Isaiah 40:31",cat:"Strength"},
{text:"Your word is a lamp for my feet, a light on my path.",ref:"Psalm 119:105",cat:"Guidance"},
{text:"Come to me, all you who are weary and burdened, and I will give you rest.",ref:"Matthew 11:28",cat:"Rest"},
{text:"Peace I leave with you; my peace I give you.",ref:"John 14:27",cat:"Peace"},
{text:"Rejoice in the Lord always. I will say it again: Rejoice!",ref:"Philippians 4:4",cat:"Joy"},
{text:"Let all that you do be done in love.",ref:"1 Corinthians 16:14",cat:"Love"},
{text:"The Lord bless you and keep you; the Lord make his face shine on you.",ref:"Numbers 6:24–25",cat:"Blessing"},
{text:"Create in me a pure heart, O God, and renew a steadfast spirit within me.",ref:"Psalm 51:10",cat:"Renewal"},
{text:"I have hidden your word in my heart that I might not sin against you.",ref:"Psalm 119:11",cat:"Memory"},
{text:"For God has not given us a spirit of fear, but of power and of love and of a sound mind.",ref:"2 Timothy 1:7",cat:"Courage"},
{text:"Be strong and courageous, because the Lord your God will be with you wherever you go.",ref:"Joshua 1:9",cat:"Courage"},
{text:"The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",ref:"Galatians 5:22–23",cat:"Character"},
{text:"Above all else, guard your heart, for everything you do flows from it.",ref:"Proverbs 4:23",cat:"Wisdom"},
{text:"A gentle answer turns away wrath, but a harsh word stirs up anger.",ref:"Proverbs 15:1",cat:"Wisdom"},
{text:"Let your conversation be always full of grace, seasoned with salt.",ref:"Colossians 4:6",cat:"Wisdom"},
{text:"He heals the brokenhearted and binds up their wounds.",ref:"Psalm 147:3",cat:"Healing"},
{text:"The Lord is my strength and my shield; my heart trusts in him.",ref:"Psalm 28:7",cat:"Strength"},
{text:"Wait for the Lord; be strong and take heart and wait for the Lord.",ref:"Psalm 27:14",cat:"Patience"},
{text:"Delight yourself in the Lord, and he will give you the desires of your heart.",ref:"Psalm 37:4",cat:"Joy"},
{text:"In the beginning God created the heavens and the earth.",ref:"Genesis 1:1",cat:"Creation"},
{text:"And God saw all that he had made, and it was very good.",ref:"Genesis 1:31",cat:"Creation"},
{text:"Blessed is the one who does not walk in step with the wicked, but whose delight is in the law of the Lord.",ref:"Psalm 1:1–2",cat:"Wisdom"},
{text:"The Lord is my light and my salvation — whom shall I fear?",ref:"Psalm 27:1",cat:"Courage"},
{text:"You will keep in perfect peace those whose minds are steadfast, because they trust in you.",ref:"Isaiah 26:3",cat:"Peace"},
{text:"My grace is sufficient for you, for my power is made perfect in weakness.",ref:"2 Corinthians 12:9",cat:"Grace"},
{text:"If we confess our sins, he is faithful and just and will forgive us our sins.",ref:"1 John 1:9",cat:"Grace"},
{text:"There is no condemnation for those who are in Christ Jesus.",ref:"Romans 8:1",cat:"Grace"},
{text:"For by grace you have been saved through faith.",ref:"Ephesians 2:8",cat:"Grace"},
{text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",ref:"Galatians 6:9",cat:"Perseverance"},
{text:"Consider it pure joy whenever you face trials of many kinds, because the testing of your faith produces perseverance.",ref:"James 1:2–3",cat:"Perseverance"},
{text:"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",ref:"Ephesians 4:32",cat:"Kindness"},
{text:"Above all, love each other deeply, because love covers over a multitude of sins.",ref:"1 Peter 4:8",cat:"Love"},
{text:"Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.",ref:"Hebrews 12:1–2",cat:"Perseverance"},
{text:"The Lord is good, a refuge in times of trouble. He cares for those who trust in him.",ref:"Nahum 1:7",cat:"Comfort"},
{text:"Even though I walk through the darkest valley, I will fear no evil, for you are with me.",ref:"Psalm 23:4",cat:"Comfort"},
{text:"My soul finds rest in God alone; my salvation comes from him.",ref:"Psalm 62:1",cat:"Rest"},
{text:"You are the light of the world. A town built on a hill cannot be hidden.",ref:"Matthew 5:14",cat:"Purpose"},
{text:"Seek first his kingdom and his righteousness, and all these things will be given to you as well.",ref:"Matthew 6:33",cat:"Purpose"},
{text:"Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",ref:"Matthew 7:7",cat:"Prayer"},
{text:"The Lord is near to all who call on him, to all who call on him in truth.",ref:"Psalm 145:18",cat:"Prayer"},
{text:"Pray continually, give thanks in all circumstances.",ref:"1 Thessalonians 5:17–18",cat:"Prayer"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
{text:"And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",ref:"Philippians 4:7",cat:"Peace"},
{text:"Finally, whatever is true, whatever is noble, whatever is right, whatever is pure — think about such things.",ref:"Philippians 4:8",cat:"Mind"},
{text:"Clothe yourselves with compassion, kindness, humility, gentleness and patience.",ref:"Colossians 3:12",cat:"Character"},
{text:"Let the peace of Christ rule in your hearts.",ref:"Colossians 3:15",cat:"Peace"},
{text:"I am with you always, to the very end of the age.",ref:"Matthew 28:20",cat:"Presence"},
{text:"Never will I leave you; never will I forsake you.",ref:"Hebrews 13:5",cat:"Presence"},
{text:"The heavens declare the glory of God; the skies proclaim the work of his hands.",ref:"Psalm 19:1",cat:"Wonder"},
{text:"Taste and see that the Lord is good; blessed is the one who takes refuge in him.",ref:"Psalm 34:8",cat:"Joy"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"The joy of the Lord is your strength.",ref:"Nehemiah 8:10",cat:"Joy"},
{text:"A cheerful heart is good medicine.",ref:"Proverbs 17:22",cat:"Joy"},
{text:"Weeping may stay for the night, but rejoicing comes in the morning.",ref:"Psalm 30:5",cat:"Hope"},
{text:"Hope does not put us to shame, because God’s love has been poured out into our hearts.",ref:"Romans 5:5",cat:"Hope"},
{text:"I remain confident of this: I will see the goodness of the Lord in the land of the living.",ref:"Psalm 27:13",cat:"Hope"},
{text:"For the Lord is good and his love endures forever.",ref:"Psalm 100:5",cat:"Gratitude"},
{text:"Give thanks to the Lord, for he is good; his love endures forever.",ref:"Psalm 107:1",cat:"Gratitude"},
{text:"In everything, give thanks.",ref:"1 Thessalonians 5:18",cat:"Gratitude"},
];
const MOODS:{name:string;emoji:string;intro:string;verses:Verse[]}[]=[
{name:"Anxious",emoji:"🌿",intro:"Breathe slowly. You don’t have to solve everything tonight. Let these words carry what feels heavy.",verses:[VERSES[10],VERSES[50],VERSES[52]]},
{name:"Grieving",emoji:"🕯️",intro:"Grief is love with nowhere to go. You are not alone in it — God draws especially near to broken hearts.",verses:[VERSES[9],VERSES[26],VERSES[62]]},
{name:"Grateful",emoji:"🌸",intro:"Gratitude turns ordinary moments into gifts. Pause and name three good things from today.",verses:[VERSES[65],VERSES[66],VERSES[67]]},
{name:"Lonely",emoji:"🤍",intro:"Loneliness can feel loud. You are seen, known, and never truly abandoned.",verses:[VERSES[55],VERSES[56],VERSES[9]]},
{name:"Angry",emoji:"🔥",intro:"Anger is a signal, not a sentence. Give it a name, give it space, and let grace cool the heat.",verses:[VERSES[24],VERSES[41],VERSES[25]]},
{name:"Hopeful",emoji:"🌅",intro:"Hope is a small light that refuses to go out. Keep it close today.",verses:[VERSES[3],VERSES[63],VERSES[64]]},
{name:"Fearful",emoji:"🛡️",intro:"Fear shrinks when we remember who walks beside us. Courage is fear with company.",verses:[VERSES[7],VERSES[20],VERSES[21]]},
{name:"Needing Direction",emoji:"🧭",intro:"You don’t need the whole map — just the next faithful step.",verses:[VERSES[4],VERSES[12],VERSES[49]]},
{name:"Tired",emoji:"🌙",intro:"Rest is not laziness. It is trust. Let yourself be held for a while.",verses:[VERSES[13],VERSES[47],VERSES[14]]},
{name:"Joyful",emoji:"✨",intro:"Joy is worth celebrating! Let it spill over today — someone near you needs it.",verses:[VERSES[15],VERSES[59],VERSES[60]]},
];
const MOOD_POOLS:Record<string,Verse[]> = {
Anxious:[
{text:"Cast all your anxiety on him because he cares for you.",ref:"1 Peter 5:7",cat:"Peace"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
{text:"You will keep in perfect peace those whose minds are steadfast, because they trust in you.",ref:"Isaiah 26:3",cat:"Peace"},
{text:"Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.",ref:"Matthew 6:34",cat:"Peace"},
{text:"When anxiety was great within me, your consolation brought me joy.",ref:"Psalm 94:19",cat:"Peace"},
{text:"Peace I leave with you; my peace I give you.",ref:"John 14:27",cat:"Peace"},
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
{text:"Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.",ref:"Psalm 55:22",cat:"Peace"},
],
Grieving:[
{text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",ref:"Psalm 34:18",cat:"Comfort"},
{text:"He heals the brokenhearted and binds up their wounds.",ref:"Psalm 147:3",cat:"Healing"},
{text:"Blessed are those who mourn, for they will be comforted.",ref:"Matthew 5:4",cat:"Comfort"},
{text:"He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.",ref:"Revelation 21:4",cat:"Hope"},
{text:"Weeping may stay for the night, but rejoicing comes in the morning.",ref:"Psalm 30:5",cat:"Hope"},
{text:"Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.",ref:"2 Corinthians 1:3–4",cat:"Comfort"},
{text:"Even though I walk through the darkest valley, I will fear no evil, for you are with me.",ref:"Psalm 23:4",cat:"Comfort"},
{text:"Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.",ref:"Psalm 42:11",cat:"Hope"},
],
Grateful:[
{text:"For the Lord is good and his love endures forever.",ref:"Psalm 100:5",cat:"Gratitude"},
{text:"Give thanks to the Lord, for he is good; his love endures forever.",ref:"Psalm 107:1",cat:"Gratitude"},
{text:"In everything, give thanks.",ref:"1 Thessalonians 5:18",cat:"Gratitude"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.",ref:"Colossians 3:17",cat:"Gratitude"},
{text:"Every good and perfect gift is from above, coming down from the Father of the heavenly lights.",ref:"James 1:17",cat:"Gratitude"},
{text:"Give thanks to the Lord, for he is good. His love endures forever.",ref:"Psalm 136:1",cat:"Gratitude"},
{text:"Always giving thanks to God the Father for everything, in the name of our Lord Jesus Christ.",ref:"Ephesians 5:20",cat:"Gratitude"},
],
Lonely:[
{text:"Never will I leave you; never will I forsake you.",ref:"Hebrews 13:5",cat:"Presence"},
{text:"I am with you always, to the very end of the age.",ref:"Matthew 28:20",cat:"Presence"},
{text:"God sets the lonely in families, he leads out the prisoners with singing.",ref:"Psalm 68:6",cat:"Comfort"},
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
{text:"Though my father and mother forsake me, the Lord will receive me.",ref:"Psalm 27:10",cat:"Comfort"},
{text:"Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.",ref:"Deuteronomy 31:6",cat:"Courage"},
{text:"Where can I go from your Spirit? Where can I flee from your presence?",ref:"Psalm 139:7",cat:"Presence"},
{text:"Even though I walk through the darkest valley, I will fear no evil, for you are with me.",ref:"Psalm 23:4",cat:"Comfort"},
],
Angry:[
{text:"A gentle answer turns away wrath, but a harsh word stirs up anger.",ref:"Proverbs 15:1",cat:"Wisdom"},
{text:"In your anger do not sin: Do not let the sun go down while you are still angry.",ref:"Ephesians 4:26",cat:"Character"},
{text:"Everyone should be quick to listen, slow to speak and slow to become angry.",ref:"James 1:19",cat:"Wisdom"},
{text:"Fools give full vent to their rage, but the wise bring calm in the end.",ref:"Proverbs 29:11",cat:"Wisdom"},
{text:"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",ref:"Ephesians 4:32",cat:"Kindness"},
{text:"Let your conversation be always full of grace, seasoned with salt.",ref:"Colossians 4:6",cat:"Wisdom"},
{text:"Refrain from anger and turn from wrath; do not fret—it leads only to evil.",ref:"Psalm 37:8",cat:"Wisdom"},
{text:"Whoever is patient has great understanding, but one who is quick-tempered displays folly.",ref:"Proverbs 14:29",cat:"Wisdom"},
],
Hopeful:[
{text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",ref:"Jeremiah 29:11",cat:"Hope"},
{text:"Hope does not put us to shame, because God’s love has been poured out into our hearts.",ref:"Romans 5:5",cat:"Hope"},
{text:"I remain confident of this: I will see the goodness of the Lord in the land of the living.",ref:"Psalm 27:13",cat:"Hope"},
{text:"Weeping may stay for the night, but rejoicing comes in the morning.",ref:"Psalm 30:5",cat:"Hope"},
{text:"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",ref:"Romans 15:13",cat:"Hope"},
{text:"Because of the Lord’s great love we are not consumed, for his compassions never fail.",ref:"Lamentations 3:22",cat:"Hope"},
{text:"But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",ref:"Isaiah 40:31",cat:"Strength"},
{text:"Let us hold unswervingly to the hope we profess, for he who promised is faithful.",ref:"Hebrews 10:23",cat:"Hope"},
],
Fearful:[
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
{text:"For God has not given us a spirit of fear, but of power and of love and of a sound mind.",ref:"2 Timothy 1:7",cat:"Courage"},
{text:"Be strong and courageous, because the Lord your God will be with you wherever you go.",ref:"Joshua 1:9",cat:"Courage"},
{text:"The Lord is my light and my salvation — whom shall I fear?",ref:"Psalm 27:1",cat:"Courage"},
{text:"When I am afraid, I put my trust in you.",ref:"Psalm 56:3",cat:"Courage"},
{text:"Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.",ref:"Deuteronomy 31:6",cat:"Courage"},
{text:"Even though I walk through the darkest valley, I will fear no evil, for you are with me.",ref:"Psalm 23:4",cat:"Comfort"},
{text:"Do not fear, for I have redeemed you; I have summoned you by name; you are mine.",ref:"Isaiah 43:1",cat:"Courage"},
],
"Needing Direction":[
{text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",ref:"Proverbs 3:5–6",cat:"Guidance"},
{text:"Your word is a lamp for my feet, a light on my path.",ref:"Psalm 119:105",cat:"Guidance"},
{text:"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.",ref:"Psalm 32:8",cat:"Guidance"},
{text:"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",ref:"James 1:5",cat:"Wisdom"},
{text:"Show me your ways, Lord, teach me your paths.",ref:"Psalm 25:4",cat:"Guidance"},
{text:"Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, “This is the way; walk in it.”",ref:"Isaiah 30:21",cat:"Guidance"},
{text:"In their hearts humans plan their course, but the Lord establishes their steps.",ref:"Proverbs 16:9",cat:"Guidance"},
{text:"Call to me and I will answer you and tell you great and unsearchable things you do not know.",ref:"Jeremiah 33:3",cat:"Guidance"},
],
Tired:[
{text:"Come to me, all you who are weary and burdened, and I will give you rest.",ref:"Matthew 11:28",cat:"Rest"},
{text:"My soul finds rest in God alone; my salvation comes from him.",ref:"Psalm 62:1",cat:"Rest"},
{text:"But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",ref:"Isaiah 40:31",cat:"Strength"},
{text:"Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.",ref:"Matthew 11:29",cat:"Rest"},
{text:"Be still, and know that I am God.",ref:"Psalm 46:10",cat:"Peace"},
{text:"The Lord replied, “My Presence will go with you, and I will give you rest.”",ref:"Exodus 33:14",cat:"Rest"},
{text:"He gives strength to the weary and increases the power of the weak.",ref:"Isaiah 40:29",cat:"Strength"},
{text:"He makes me lie down in green pastures, he leads me beside quiet waters.",ref:"Psalm 23:2",cat:"Rest"},
],
Joyful:[
{text:"Rejoice in the Lord always. I will say it again: Rejoice!",ref:"Philippians 4:4",cat:"Joy"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"The joy of the Lord is your strength.",ref:"Nehemiah 8:10",cat:"Joy"},
{text:"A cheerful heart is good medicine.",ref:"Proverbs 17:22",cat:"Joy"},
{text:"You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.",ref:"Psalm 16:11",cat:"Joy"},
{text:"Worship the Lord with gladness; come before him with joyful songs.",ref:"Psalm 100:2",cat:"Joy"},
{text:"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",ref:"Romans 15:13",cat:"Joy"},
{text:"You turned my wailing into dancing; you removed my sackcloth and clothed me with joy.",ref:"Psalm 30:11",cat:"Joy"},
],
};
const TOPIC_META:{name:string;emoji:string;desc:string;color:string}[]=[
{name:"Love",emoji:"❤️",desc:"Verses about God's love and loving others.",color:"#ffe3e3"},
{name:"Faith",emoji:"🙏",desc:"Trusting God even when you cannot see the way.",color:"#e8e0ff"},
{name:"Hope",emoji:"🌅",desc:"A future held by God, even in dark seasons.",color:"#fff0c9"},
{name:"Strength",emoji:"💪",desc:"Strength for today when you feel weak.",color:"#e0f2ff"},
{name:"Comfort",emoji:"🤍",desc:"Nearness and tenderness for hurting hearts.",color:"#fde8f0"},
{name:"Wisdom",emoji:"🦉",desc:"Clear thinking and wise choices for daily life.",color:"#e6f4ea"},
{name:"Peace",emoji:"🕊️",desc:"Calm that guards heart and mind.",color:"#dff5f2"},
{name:"Gratitude",emoji:"🌸",desc:"Noticing gifts and giving thanks.",color:"#fff2d6"},
{name:"Courage",emoji:"🛡️",desc:"Brave steps with God beside you.",color:"#ffe8cc"},
{name:"Forgiveness",emoji:"💛",desc:"Grace received, grace given.",color:"#fff3c4"},
{name:"Marriage",emoji:"💍",desc:"Love, faithfulness, and partnership in marriage.",color:"#ffe6f0"},
{name:"Wedding",emoji:"💒",desc:"Joy, covenant, and celebration for a wedding day.",color:"#ffeef5"},
{name:"Money",emoji:"💰",desc:"Contentment, generosity, and wise stewardship.",color:"#e6f7e0"},
{name:"Anger",emoji:"🔥",desc:"Slow to anger, quick to listen, full of grace.",color:"#ffe0d6"},
{name:"Thanksgiving",emoji:"🍂",desc:"Thanks in every season, for every good gift.",color:"#ffefd0"},
{name:"Addiction",emoji:"⛓️",desc:"Freedom, new strength, and a way through.",color:"#e6ecff"},
{name:"Life Moments",emoji:"🌿",desc:"Verses for beginnings, endings, and in-between days.",color:"#e8f5e9"},
{name:"Healing",emoji:"💚",desc:"God who heals, restores, and binds up wounds.",color:"#dff6e2"},
{name:"Anxiety",emoji:"😌",desc:"Breathe. Cast your cares. You are not alone.",color:"#e6f7f5"},
{name:"Family",emoji:"👨‍👩‍👧",desc:"Home, belonging, and love that lasts.",color:"#ffe9d2"},
{name:"Work",emoji:"🔨",desc:"Work with purpose, rest with trust.",color:"#eee6ff"},
{name:"Joy",emoji:"✨",desc:"Joy that is deeper than circumstance.",color:"#fff6c9"},
{name:"Patience",emoji:"⏳",desc:"Waiting well and trusting God's timing.",color:"#e8f0ff"},
{name:"Kindness",emoji:"💛",desc:"Gentle words and generous hearts.",color:"#fff0d0"},
{name:"Protection",emoji:"🛡️",desc:"A refuge and shelter in every storm.",color:"#dfeeff"},
{name:"Guidance",emoji:"🧭",desc:"The next faithful step, lit by God's word.",color:"#e6f2ff"},
{name:"Blessings",emoji:"🎁",desc:"Good gifts from a generous Father.",color:"#fff3d6"},
{name:"Prayer",emoji:"🙏",desc:"Come close, ask, listen, and be heard.",color:"#f0e8ff"},
{name:"Salvation",emoji:"✝️",desc:"Saved by grace through faith in Christ.",color:"#ffe8e0"},
{name:"Purpose",emoji:"🎯",desc:"Made with intention, for good work.",color:"#e8f7e8"},
];
const TOPIC_VERSES:Record<string,Verse[]>={
Love:[
{text:"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",ref:"John 3:16",cat:"Love"},
{text:"Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",ref:"1 Corinthians 13:4",cat:"Love"},
{text:"Above all, love each other deeply, because love covers over a multitude of sins.",ref:"1 Peter 4:8",cat:"Love"},
{text:"Let all that you do be done in love.",ref:"1 Corinthians 16:14",cat:"Love"},
{text:"This is love: not that we loved God, but that he loved us and sent his Son as an atoning sacrifice for our sins.",ref:"1 John 4:10",cat:"Love"},
{text:"And now these three remain: faith, hope and love. But the greatest of these is love.",ref:"1 Corinthians 13:13",cat:"Love"},
{text:"We love because he first loved us.",ref:"1 John 4:19",cat:"Love"},
{text:"Let no debt remain outstanding, except the continuing debt to love one another.",ref:"Romans 13:8",cat:"Love"},
],
Faith:[
{text:"Now faith is confidence in what we hope for and assurance about what we do not see.",ref:"Hebrews 11:1",cat:"Faith"},
{text:"For we live by faith, not by sight.",ref:"2 Corinthians 5:7",cat:"Faith"},
{text:"For by grace you have been saved through faith.",ref:"Ephesians 2:8",cat:"Grace"},
{text:"If you have faith as small as a mustard seed, you can say to this mountain, 'Move from here to there,' and it will move.",ref:"Matthew 17:20",cat:"Faith"},
{text:"I have fought the good fight, I have finished the race, I have kept the faith.",ref:"2 Timothy 4:7",cat:"Faith"},
{text:"Consequently, faith comes from hearing the message, and the message is heard through the word about Christ.",ref:"Romans 10:17",cat:"Faith"},
{text:"But when you ask, you must believe and not doubt.",ref:"James 1:6",cat:"Faith"},
{text:"Trust in the Lord with all your heart and lean not on your own understanding.",ref:"Proverbs 3:5",cat:"Guidance"},
],
Hope:[
{text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",ref:"Jeremiah 29:11",cat:"Hope"},
{text:"Hope does not put us to shame, because God's love has been poured out into our hearts.",ref:"Romans 5:5",cat:"Hope"},
{text:"I remain confident of this: I will see the goodness of the Lord in the land of the living.",ref:"Psalm 27:13",cat:"Hope"},
{text:"Weeping may stay for the night, but rejoicing comes in the morning.",ref:"Psalm 30:5",cat:"Hope"},
{text:"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",ref:"Romans 15:13",cat:"Hope"},
{text:"But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",ref:"Isaiah 40:31",cat:"Strength"},
{text:"Let us hold unswervingly to the hope we profess, for he who promised is faithful.",ref:"Hebrews 10:23",cat:"Hope"},
{text:"For in this hope we were saved.",ref:"Romans 8:24",cat:"Hope"},
],
Strength:[
{text:"I can do all this through him who gives me strength.",ref:"Philippians 4:13",cat:"Strength"},
{text:"My grace is sufficient for you, for my power is made perfect in weakness.",ref:"2 Corinthians 12:9",cat:"Grace"},
{text:"The Lord is my strength and my shield; my heart trusts in him.",ref:"Psalm 28:7",cat:"Strength"},
{text:"He gives strength to the weary and increases the power of the weak.",ref:"Isaiah 40:29",cat:"Strength"},
{text:"Be strong and courageous, because the Lord your God will be with you wherever you go.",ref:"Joshua 1:9",cat:"Courage"},
{text:"The joy of the Lord is your strength.",ref:"Nehemiah 8:10",cat:"Joy"},
{text:"God is our refuge and strength, an ever-present help in trouble.",ref:"Psalm 46:1",cat:"Strength"},
{text:"Finally, be strong in the Lord and in his mighty power.",ref:"Ephesians 6:10",cat:"Strength"},
],
Comfort:[
{text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",ref:"Psalm 34:18",cat:"Comfort"},
{text:"Even though I walk through the darkest valley, I will fear no evil, for you are with me.",ref:"Psalm 23:4",cat:"Comfort"},
{text:"Blessed are those who mourn, for they will be comforted.",ref:"Matthew 5:4",cat:"Comfort"},
{text:"He heals the brokenhearted and binds up their wounds.",ref:"Psalm 147:3",cat:"Healing"},
{text:"The Lord is good, a refuge in times of trouble. He cares for those who trust in him.",ref:"Nahum 1:7",cat:"Comfort"},
{text:"Praise be to the God of all comfort, who comforts us in all our troubles.",ref:"2 Corinthians 1:3–4",cat:"Comfort"},
{text:"Come to me, all you who are weary and burdened, and I will give you rest.",ref:"Matthew 11:28",cat:"Rest"},
{text:"As a mother comforts her child, so will I comfort you.",ref:"Isaiah 66:13",cat:"Comfort"},
],
Wisdom:[
{text:"Above all else, guard your heart, for everything you do flows from it.",ref:"Proverbs 4:23",cat:"Wisdom"},
{text:"A gentle answer turns away wrath, but a harsh word stirs up anger.",ref:"Proverbs 15:1",cat:"Wisdom"},
{text:"Blessed is the one who does not walk in step with the wicked, but whose delight is in the law of the Lord.",ref:"Psalm 1:1–2",cat:"Wisdom"},
{text:"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",ref:"James 1:5",cat:"Wisdom"},
{text:"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.",ref:"Proverbs 9:10",cat:"Wisdom"},
{text:"Let your conversation be always full of grace, seasoned with salt.",ref:"Colossians 4:6",cat:"Wisdom"},
{text:"In their hearts humans plan their course, but the Lord establishes their steps.",ref:"Proverbs 16:9",cat:"Guidance"},
{text:"Trust in the Lord with all your heart and lean not on your own understanding.",ref:"Proverbs 3:5",cat:"Guidance"},
],
Peace:[
{text:"Be still, and know that I am God.",ref:"Psalm 46:10",cat:"Peace"},
{text:"Peace I leave with you; my peace I give you.",ref:"John 14:27",cat:"Peace"},
{text:"Cast all your anxiety on him because he cares for you.",ref:"1 Peter 5:7",cat:"Peace"},
{text:"You will keep in perfect peace those whose minds are steadfast, because they trust in you.",ref:"Isaiah 26:3",cat:"Peace"},
{text:"And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",ref:"Philippians 4:7",cat:"Peace"},
{text:"Let the peace of Christ rule in your hearts.",ref:"Colossians 3:15",cat:"Peace"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
{text:"The Lord gives strength to his people; the Lord blesses his people with peace.",ref:"Psalm 29:11",cat:"Peace"},
],
Gratitude:[
{text:"For the Lord is good and his love endures forever.",ref:"Psalm 100:5",cat:"Gratitude"},
{text:"Give thanks to the Lord, for he is good; his love endures forever.",ref:"Psalm 107:1",cat:"Gratitude"},
{text:"In everything, give thanks.",ref:"1 Thessalonians 5:18",cat:"Gratitude"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"Every good and perfect gift is from above, coming down from the Father of the heavenly lights.",ref:"James 1:17",cat:"Gratitude"},
{text:"Give thanks to the Lord, for he is good. His love endures forever.",ref:"Psalm 136:1",cat:"Gratitude"},
{text:"Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.",ref:"Psalm 100:4",cat:"Gratitude"},
{text:"And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.",ref:"Colossians 3:17",cat:"Gratitude"},
],
Courage:[
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
{text:"For God has not given us a spirit of fear, but of power and of love and of a sound mind.",ref:"2 Timothy 1:7",cat:"Courage"},
{text:"The Lord is my light and my salvation — whom shall I fear?",ref:"Psalm 27:1",cat:"Courage"},
{text:"Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you; he will never leave you nor forsake you.",ref:"Deuteronomy 31:6",cat:"Courage"},
{text:"When I am afraid, I put my trust in you.",ref:"Psalm 56:3",cat:"Courage"},
{text:"Do not fear, for I have redeemed you; I have summoned you by name; you are mine.",ref:"Isaiah 43:1",cat:"Courage"},
{text:"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",ref:"Joshua 1:9",cat:"Courage"},
{text:"The Lord is my helper; I will not be afraid.",ref:"Hebrews 13:6",cat:"Courage"},
],
Forgiveness:[
{text:"If we confess our sins, he is faithful and just and will forgive us our sins.",ref:"1 John 1:9",cat:"Grace"},
{text:"There is no condemnation for those who are in Christ Jesus.",ref:"Romans 8:1",cat:"Grace"},
{text:"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",ref:"Ephesians 4:32",cat:"Kindness"},
{text:"For if you forgive other people when they sin against you, your heavenly Father will also forgive you.",ref:"Matthew 6:14",cat:"Forgiveness"},
{text:"Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.",ref:"Colossians 3:13",cat:"Forgiveness"},
{text:"As far as the east is from the west, so far has he removed our transgressions from us.",ref:"Psalm 103:12",cat:"Forgiveness"},
{text:"Create in me a pure heart, O God, and renew a steadfast spirit within me.",ref:"Psalm 51:10",cat:"Renewal"},
{text:"For by grace you have been saved through faith.",ref:"Ephesians 2:8",cat:"Grace"},
],
Marriage:[
{text:"Therefore what God has joined together, let no one separate.",ref:"Mark 10:9",cat:"Marriage"},
{text:"Husbands, love your wives, just as Christ loved the church and gave himself up for her.",ref:"Ephesians 5:25",cat:"Marriage"},
{text:"Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.",ref:"Ecclesiastes 4:9–10",cat:"Marriage"},
{text:"Above all, love each other deeply, because love covers over a multitude of sins.",ref:"1 Peter 4:8",cat:"Love"},
{text:"Let marriage be held in honor among all.",ref:"Hebrews 13:4",cat:"Marriage"},
{text:"Be completely humble and gentle; be patient, bearing with one another in love.",ref:"Ephesians 4:2",cat:"Marriage"},
{text:"Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",ref:"1 Corinthians 13:4",cat:"Love"},
{text:"And over all these virtues put on love, which binds them all together in perfect unity.",ref:"Colossians 3:14",cat:"Love"},
],
Wedding:[
{text:"And now these three remain: faith, hope and love. But the greatest of these is love.",ref:"1 Corinthians 13:13",cat:"Love"},
{text:"I have found the one whom my soul loves.",ref:"Song of Solomon 3:4",cat:"Wedding"},
{text:"Set me as a seal upon your heart, as a seal upon your arm, for love is strong as death.",ref:"Song of Solomon 8:7",cat:"Wedding"},
{text:"Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",ref:"1 Corinthians 13:4",cat:"Love"},
{text:"The Lord bless you and keep you; the Lord make his face shine on you.",ref:"Numbers 6:24–25",cat:"Blessing"},
{text:"Above all, clothe yourselves with love, which binds everything together in perfect harmony.",ref:"Colossians 3:14",cat:"Love"},
{text:"Let all that you do be done in love.",ref:"1 Corinthians 16:14",cat:"Love"},
{text:"A cord of three strands is not quickly broken.",ref:"Ecclesiastes 4:12",cat:"Wedding"},
],
Money:[
{text:"For the love of money is a root of all kinds of evil.",ref:"1 Timothy 6:10",cat:"Money"},
{text:"Keep your lives free from the love of money and be content with what you have, because God has said, 'Never will I leave you; never will I forsake you.'",ref:"Hebrews 13:5",cat:"Money"},
{text:"Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, and see if I will not throw open the floodgates of heaven.",ref:"Malachi 3:10",cat:"Money"},
{text:"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",ref:"2 Corinthians 9:7",cat:"Money"},
{text:"The plans of the diligent lead to profit as surely as haste leads to poverty.",ref:"Proverbs 21:5",cat:"Money"},
{text:"Dishonest money dwindles away, but whoever gathers money little by little makes it grow.",ref:"Proverbs 13:11",cat:"Money"},
{text:"Seek first his kingdom and his righteousness, and all these things will be given to you as well.",ref:"Matthew 6:33",cat:"Purpose"},
{text:"And my God will meet all your needs according to the riches of his glory in Christ Jesus.",ref:"Philippians 4:19",cat:"Money"},
],
Anger:[
{text:"A gentle answer turns away wrath, but a harsh word stirs up anger.",ref:"Proverbs 15:1",cat:"Wisdom"},
{text:"In your anger do not sin: Do not let the sun go down while you are still angry.",ref:"Ephesians 4:26",cat:"Character"},
{text:"Everyone should be quick to listen, slow to speak and slow to become angry.",ref:"James 1:19",cat:"Wisdom"},
{text:"Refrain from anger and turn from wrath; do not fret—it leads only to evil.",ref:"Psalm 37:8",cat:"Wisdom"},
{text:"Whoever is patient has great understanding, but one who is quick-tempered displays folly.",ref:"Proverbs 14:29",cat:"Wisdom"},
{text:"Fools give full vent to their rage, but the wise bring calm in the end.",ref:"Proverbs 29:11",cat:"Wisdom"},
{text:"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",ref:"Ephesians 4:32",cat:"Kindness"},
{text:"A hot-tempered person stirs up conflict, but the one who is patient calms a quarrel.",ref:"Proverbs 15:18",cat:"Wisdom"},
],
Thanksgiving:[
{text:"Give thanks to the Lord, for he is good; his love endures forever.",ref:"Psalm 107:1",cat:"Gratitude"},
{text:"Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.",ref:"Psalm 100:4",cat:"Gratitude"},
{text:"Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",ref:"1 Thessalonians 5:18",cat:"Gratitude"},
{text:"Oh give thanks to the Lord, for he is good, for his steadfast love endures forever!",ref:"Psalm 107:1",cat:"Gratitude"},
{text:"Let us come before him with thanksgiving and extol him with music and song.",ref:"Psalm 95:2",cat:"Thanksgiving"},
{text:"Every good and perfect gift is from above.",ref:"James 1:17",cat:"Gratitude"},
{text:"I will give thanks to you, Lord, with all my heart; I will tell of all your wonderful deeds.",ref:"Psalm 9:1",cat:"Thanksgiving"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
],
Addiction:[
{text:"So if the Son sets you free, you will be free indeed.",ref:"John 8:36",cat:"Freedom"},
{text:"No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.",ref:"1 Corinthians 10:13",cat:"Freedom"},
{text:"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",ref:"2 Corinthians 5:17",cat:"Renewal"},
{text:"It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.",ref:"Galatians 5:1",cat:"Freedom"},
{text:"I can do all this through him who gives me strength.",ref:"Philippians 4:13",cat:"Strength"},
{text:"My grace is sufficient for you, for my power is made perfect in weakness.",ref:"2 Corinthians 12:9",cat:"Grace"},
{text:"Walk by the Spirit, and you will not gratify the desires of the flesh.",ref:"Galatians 5:16",cat:"Freedom"},
{text:"Submit yourselves, then, to God. Resist the devil, and he will flee from you.",ref:"James 4:7",cat:"Freedom"},
],
"Life Moments":[
{text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",ref:"Jeremiah 29:11",cat:"Hope"},
{text:"There is a time for everything, and a season for every activity under the heavens.",ref:"Ecclesiastes 3:1",cat:"Life Moments"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"Trust in the Lord with all your heart and lean not on your own understanding.",ref:"Proverbs 3:5",cat:"Guidance"},
{text:"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.",ref:"Psalm 32:8",cat:"Guidance"},
{text:"The Lord will watch over your coming and going both now and forevermore.",ref:"Psalm 121:8",cat:"Protection"},
{text:"Be strong and courageous, because the Lord your God will be with you wherever you go.",ref:"Joshua 1:9",cat:"Courage"},
{text:"And we know that in all things God works for the good of those who love him.",ref:"Romans 8:28",cat:"Hope"},
],
Healing:[
{text:"He heals the brokenhearted and binds up their wounds.",ref:"Psalm 147:3",cat:"Healing"},
{text:"But I will restore you to health and heal your wounds, declares the Lord.",ref:"Jeremiah 30:17",cat:"Healing"},
{text:"Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I praise.",ref:"Jeremiah 17:14",cat:"Healing"},
{text:"He sent out his word and healed them; he rescued them from the grave.",ref:"Psalm 107:20",cat:"Healing"},
{text:"But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.",ref:"Isaiah 53:5",cat:"Healing"},
{text:"The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",ref:"Psalm 23:1–3",cat:"Comfort"},
{text:"Is anyone among you sick? Let them call the elders of the church to pray over them and anoint them with oil in the name of the Lord.",ref:"James 5:14",cat:"Healing"},
{text:"My soul finds rest in God alone; my salvation comes from him.",ref:"Psalm 62:1",cat:"Rest"},
],
Anxiety:[
{text:"Cast all your anxiety on him because he cares for you.",ref:"1 Peter 5:7",cat:"Peace"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
{text:"When anxiety was great within me, your consolation brought me joy.",ref:"Psalm 94:19",cat:"Peace"},
{text:"Therefore do not worry about tomorrow, for tomorrow will worry about itself.",ref:"Matthew 6:34",cat:"Peace"},
{text:"Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.",ref:"Psalm 55:22",cat:"Peace"},
{text:"Peace I leave with you; my peace I give you.",ref:"John 14:27",cat:"Peace"},
{text:"You will keep in perfect peace those whose minds are steadfast, because they trust in you.",ref:"Isaiah 26:3",cat:"Peace"},
{text:"Do not fear, for I am with you; do not be dismayed, for I am your God.",ref:"Isaiah 41:10",cat:"Courage"},
],
Family:[
{text:"God sets the lonely in families, he leads out the prisoners with singing.",ref:"Psalm 68:6",cat:"Comfort"},
{text:"Honor your father and your mother, so that you may live long in the land the Lord your God is giving you.",ref:"Exodus 20:12",cat:"Family"},
{text:"Start children off on the way they should go, and even when they are old they will not turn from it.",ref:"Proverbs 22:6",cat:"Family"},
{text:"But as for me and my household, we will serve the Lord.",ref:"Joshua 24:15",cat:"Family"},
{text:"Children are a heritage from the Lord, offspring a reward from him.",ref:"Psalm 127:3",cat:"Family"},
{text:"How good and pleasant it is when God's people live together in unity!",ref:"Psalm 133:1",cat:"Family"},
{text:"Above all, love each other deeply, because love covers over a multitude of sins.",ref:"1 Peter 4:8",cat:"Love"},
{text:"Be devoted to one another in love. Honor one another above yourselves.",ref:"Romans 12:10",cat:"Family"},
],
Work:[
{text:"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",ref:"Colossians 3:23",cat:"Work"},
{text:"Commit to the Lord whatever you do, and he will establish your plans.",ref:"Proverbs 16:3",cat:"Work"},
{text:"Six days you shall labor and do all your work, but the seventh day is a sabbath to the Lord your God.",ref:"Exodus 20:9–10",cat:"Work"},
{text:"The plans of the diligent lead to profit as surely as haste leads to poverty.",ref:"Proverbs 21:5",cat:"Work"},
{text:"Do not wear yourself out to get rich; do not trust your own cleverness.",ref:"Proverbs 23:4",cat:"Work"},
{text:"Come to me, all you who are weary and burdened, and I will give you rest.",ref:"Matthew 11:28",cat:"Rest"},
{text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",ref:"Galatians 6:9",cat:"Perseverance"},
{text:"And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus.",ref:"Colossians 3:17",cat:"Work"},
],
Joy:[
{text:"Rejoice in the Lord always. I will say it again: Rejoice!",ref:"Philippians 4:4",cat:"Joy"},
{text:"This is the day the Lord has made; let us rejoice and be glad in it.",ref:"Psalm 118:24",cat:"Joy"},
{text:"The joy of the Lord is your strength.",ref:"Nehemiah 8:10",cat:"Joy"},
{text:"A cheerful heart is good medicine.",ref:"Proverbs 17:22",cat:"Joy"},
{text:"You make known to me the path of life; you will fill me with joy in your presence.",ref:"Psalm 16:11",cat:"Joy"},
{text:"Taste and see that the Lord is good; blessed is the one who takes refuge in him.",ref:"Psalm 34:8",cat:"Joy"},
{text:"The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",ref:"Galatians 5:22–23",cat:"Character"},
{text:"Worship the Lord with gladness; come before him with joyful songs.",ref:"Psalm 100:2",cat:"Joy"},
],
Patience:[
{text:"Wait for the Lord; be strong and take heart and wait for the Lord.",ref:"Psalm 27:14",cat:"Patience"},
{text:"Be joyful in hope, patient in affliction, faithful in prayer.",ref:"Romans 12:12",cat:"Patience"},
{text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",ref:"Galatians 6:9",cat:"Perseverance"},
{text:"But if we hope for what we do not yet have, we wait for it patiently.",ref:"Romans 8:25",cat:"Patience"},
{text:"Love is patient, love is kind.",ref:"1 Corinthians 13:4",cat:"Love"},
{text:"Whoever is patient has great understanding, but one who is quick-tempered displays folly.",ref:"Proverbs 14:29",cat:"Wisdom"},
{text:"Better a patient person than a warrior, one with self-control than one who takes a city.",ref:"Proverbs 16:32",cat:"Patience"},
{text:"Consider it pure joy whenever you face trials of many kinds, because the testing of your faith produces perseverance.",ref:"James 1:2–3",cat:"Perseverance"},
],
Kindness:[
{text:"Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",ref:"Ephesians 4:32",cat:"Kindness"},
{text:"Clothe yourselves with compassion, kindness, humility, gentleness and patience.",ref:"Colossians 3:12",cat:"Character"},
{text:"The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",ref:"Galatians 5:22–23",cat:"Character"},
{text:"A gentle answer turns away wrath, but a harsh word stirs up anger.",ref:"Proverbs 15:1",cat:"Wisdom"},
{text:"Let your conversation be always full of grace, seasoned with salt.",ref:"Colossians 4:6",cat:"Wisdom"},
{text:"Do not repay anyone evil for evil. Be careful to do what is right in the eyes of everyone.",ref:"Romans 12:17",cat:"Kindness"},
{text:"Whoever is kind to the poor lends to the Lord, and he will reward them for what they have done.",ref:"Proverbs 19:17",cat:"Kindness"},
{text:"Love your neighbor as yourself.",ref:"Matthew 22:39",cat:"Love"},
],
Protection:[
{text:"The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge.",ref:"Psalm 18:2",cat:"Protection"},
{text:"The Lord will keep you from all harm — he will watch over your life; the Lord will watch over your coming and going both now and forevermore.",ref:"Psalm 121:7–8",cat:"Protection"},
{text:"Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.",ref:"Psalm 91:1",cat:"Protection"},
{text:"God is our refuge and strength, an ever-present help in trouble.",ref:"Psalm 46:1",cat:"Strength"},
{text:"The name of the Lord is a fortified tower; the righteous run to it and are safe.",ref:"Proverbs 18:10",cat:"Protection"},
{text:"The Lord is my light and my salvation — whom shall I fear?",ref:"Psalm 27:1",cat:"Courage"},
{text:"No weapon forged against you will prevail.",ref:"Isaiah 54:17",cat:"Protection"},
{text:"The angel of the Lord encamps around those who fear him, and he delivers them.",ref:"Psalm 34:7",cat:"Protection"},
],
Guidance:[
{text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",ref:"Proverbs 3:5–6",cat:"Guidance"},
{text:"Your word is a lamp for my feet, a light on my path.",ref:"Psalm 119:105",cat:"Guidance"},
{text:"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.",ref:"Psalm 32:8",cat:"Guidance"},
{text:"Show me your ways, Lord, teach me your paths.",ref:"Psalm 25:4",cat:"Guidance"},
{text:"Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, 'This is the way; walk in it.'",ref:"Isaiah 30:21",cat:"Guidance"},
{text:"In their hearts humans plan their course, but the Lord establishes their steps.",ref:"Proverbs 16:9",cat:"Guidance"},
{text:"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",ref:"James 1:5",cat:"Wisdom"},
{text:"Call to me and I will answer you and tell you great and unsearchable things you do not know.",ref:"Jeremiah 33:3",cat:"Guidance"},
],
Blessings:[
{text:"The Lord bless you and keep you; the Lord make his face shine on you.",ref:"Numbers 6:24–25",cat:"Blessing"},
{text:"Every good and perfect gift is from above, coming down from the Father of the heavenly lights.",ref:"James 1:17",cat:"Gratitude"},
{text:"Blessed is the one who does not walk in step with the wicked, but whose delight is in the law of the Lord.",ref:"Psalm 1:1–2",cat:"Wisdom"},
{text:"Blessed are the poor in spirit, for theirs is the kingdom of heaven.",ref:"Matthew 5:3",cat:"Blessing"},
{text:"And my God will meet all your needs according to the riches of his glory in Christ Jesus.",ref:"Philippians 4:19",cat:"Blessing"},
{text:"The Lord is my shepherd, I lack nothing.",ref:"Psalm 23:1",cat:"Comfort"},
{text:"Praise the Lord, my soul; all my inmost being, praise his holy name.",ref:"Psalm 103:1",cat:"Blessing"},
{text:"Taste and see that the Lord is good; blessed is the one who takes refuge in him.",ref:"Psalm 34:8",cat:"Joy"},
],
Prayer:[
{text:"Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",ref:"Matthew 7:7",cat:"Prayer"},
{text:"The Lord is near to all who call on him, to all who call on him in truth.",ref:"Psalm 145:18",cat:"Prayer"},
{text:"Pray continually, give thanks in all circumstances.",ref:"1 Thessalonians 5:17–18",cat:"Prayer"},
{text:"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",ref:"Philippians 4:6",cat:"Peace"},
{text:"This, then, is how you should pray: 'Our Father in heaven, hallowed be your name.'",ref:"Matthew 6:9",cat:"Prayer"},
{text:"Call to me and I will answer you and tell you great and unsearchable things you do not know.",ref:"Jeremiah 33:3",cat:"Guidance"},
{text:"Then you will call on me and come and pray to me, and I will listen to you.",ref:"Jeremiah 29:12",cat:"Prayer"},
{text:"The prayer of a righteous person is powerful and effective.",ref:"James 5:16",cat:"Prayer"},
],
Salvation:[
{text:"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",ref:"John 3:16",cat:"Love"},
{text:"For by grace you have been saved through faith.",ref:"Ephesians 2:8",cat:"Grace"},
{text:"There is no condemnation for those who are in Christ Jesus.",ref:"Romans 8:1",cat:"Grace"},
{text:"If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved.",ref:"Romans 10:9",cat:"Salvation"},
{text:"Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved.",ref:"Acts 4:12",cat:"Salvation"},
{text:"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",ref:"2 Corinthians 5:17",cat:"Renewal"},
{text:"For the Son of Man came to seek and to save the lost.",ref:"Luke 19:10",cat:"Salvation"},
{text:"Whoever believes in the Son has eternal life.",ref:"John 3:36",cat:"Salvation"},
],
Purpose:[
{text:"You are the light of the world. A town built on a hill cannot be hidden.",ref:"Matthew 5:14",cat:"Purpose"},
{text:"Seek first his kingdom and his righteousness, and all these things will be given to you as well.",ref:"Matthew 6:33",cat:"Purpose"},
{text:"For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",ref:"Ephesians 2:10",cat:"Purpose"},
{text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",ref:"Romans 8:28",cat:"Hope"},
{text:"I can do all this through him who gives me strength.",ref:"Philippians 4:13",cat:"Strength"},
{text:"Commit to the Lord whatever you do, and he will establish your plans.",ref:"Proverbs 16:3",cat:"Purpose"},
{text:"Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",ref:"Matthew 5:16",cat:"Purpose"},
{text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",ref:"Jeremiah 29:11",cat:"Hope"},
],
};
function parseVerseRef(ref:string){
  const m=ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if(!m) return null;
  let book=m[1].trim();
  if(book==="Psalm") book="Psalms";
  if(!BOOKS.find(b=>b.name===book)){
    if(BOOKS.find(b=>b.name===book+"s")) book=book+"s";
    else if(book.endsWith("s")&&BOOKS.find(b=>b.name===book.slice(0,-1))) book=book.slice(0,-1);
    else return null;
  }
  return {book,chapter:Number(m[2]),verse:Number(m[3])};
}
function getChapterLines(book:string,chapter:number){
  const variants=[`${book} ${chapter}`];
  if(book==="Psalms") variants.push(`Psalm ${chapter}`);
  if(book==="Psalm") variants.push(`Psalms ${chapter}`);
  for(const k of variants){ if(CHAPTERS[k]) return CHAPTERS[k]; }
  return null;
}
const CHAPTERS:Record<string,string[]>={
"Psalm 23":["The Lord is my shepherd, I lack nothing.","He makes me lie down in green pastures, he leads me beside quiet waters,","he refreshes my soul. He guides me along the right paths for his name’s sake.","Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.","You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.","Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever."],
"Psalm 1":["Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers,","but whose delight is in the law of the Lord, and who meditates on his law day and night.","That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither — whatever they do prospers.","Not so the wicked! They are like chaff that the wind blows away.","Therefore the wicked will not stand in the judgment, nor sinners in the assembly of the righteous.","For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction."],
"1 Corinthians 13":["If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong or a clanging cymbal.","If I have the gift of prophecy and can fathom all mysteries and all knowledge, and if I have a faith that can move mountains, but do not have love, I am nothing.","If I give all I possess to the poor and give over my body to hardship that I may boast, but do not have love, I gain nothing.","Love is patient, love is kind. It does not envy, it does not boast, it is not proud.","It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.","Love does not delight in evil but rejoices with the truth.","It always protects, always trusts, always hopes, always perseveres.","Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled; where there is knowledge, it will pass away.","For we know in part and we prophesy in part,","but when completeness comes, what is in part disappears.","When I was a child, I talked like a child, I thought like a child, I reasoned like a child. When I became a man, I put the ways of childhood behind me.","For now we see only a reflection as in a mirror; then we shall see face to face. Now I know in part; then I shall know fully, even as I am fully known.","And now these three remain: faith, hope and love. But the greatest of these is love."],
"Genesis 1":["In the beginning God created the heavens and the earth.","Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.","And God said, “Let there be light,” and there was light.","God saw that the light was good, and he separated the light from the darkness.","God called the light “day,” and the darkness he called “night.” And there was evening, and there was morning — the first day.","And God said, “Let there be a vault between the waters to separate water from water.”","So God made the vault and separated the water under the vault from the water above it. And it was so.","God called the vault “sky.” And there was evening, and there was morning — the second day.","And God said, “Let the water under the sky be gathered to one place, and let dry ground appear.” And it was so.","God called the dry ground “land,” and the gathered waters he called “seas.” And God saw that it was good.","Then God said, “Let the land produce vegetation: seed-bearing plants and trees on the land that bear fruit with seed in it, according to their various kinds.” And it was so.","The land produced vegetation: plants bearing seed according to their kinds and trees bearing fruit with seed in it according to their kinds. And God saw that it was good.","And there was evening, and there was morning — the third day.","And God said, “Let there be lights in the vault of the sky to separate the day from the night, and let them serve as signs to mark sacred times, and days and years,","and let them be lights in the vault of the sky to give light on the earth.” And it was so.","God made two great lights — the greater light to govern the day and the lesser light to govern the night. He also made the stars.","God set them in the vault of the sky to give light on the earth,","to govern the day and the night, and to separate light from darkness. And God saw that it was good.","And there was evening, and there was morning — the fourth day.","And God said, “Let the water teem with living creatures, and let birds fly above the earth across the vault of the sky.”","So God created the great creatures of the sea and every living thing with which the water teems and that moves about in it, according to their kinds, and every winged bird according to its kind. And God saw that it was good.","God blessed them and said, “Be fruitful and increase in number and fill the water in the seas, and let the birds increase on the earth.”","And there was evening, and there was morning — the fifth day.","And God said, “Let the land produce living creatures according to their kinds: the livestock, the creatures that move along the ground, and the wild animals, each according to its kind.” And it was so.","God made the wild animals according to their kinds, the livestock according to their kinds, and all the creatures that move along the ground according to their kinds. And God saw that it was good.","Then God said, “Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground.”","So God created mankind in his own image, in the image of God he created them; male and female he created them.","God blessed them and said to them, “Be fruitful and increase in number; fill the earth and subdue it. Rule over the fish in the sea and the birds in the sky and over every living creature that moves on the ground.”","Then God said, “I give you every seed-bearing plant on the face of the whole earth and every tree that has fruit with seed in it. They will be yours for food.","And to all the beasts of the earth and all the birds in the sky and all the creatures that move along the ground — everything that has the breath of life in it — I give every green plant for food.” And it was so.","God saw all that he had made, and it was very good. And there was evening, and there was morning — the sixth day."],
"John 3":["Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council.","He came to Jesus at night and said, “Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him.”","Jesus replied, “Very truly I tell you, no one can see the kingdom of God unless they are born again.”","“How can someone be born when they are old?” Nicodemus asked. “Surely they cannot enter a second time into their mother’s womb to be born!”","Jesus answered, “Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit.","Flesh gives birth to flesh, but the Spirit gives birth to spirit.","You should not be surprised at my saying, ‘You must be born again.’","The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit.”","“How can this be?” Nicodemus asked.","“You are Israel’s teacher,” said Jesus, “and do you not understand these things?","Very truly I tell you, we speak of what we know, and we testify to what we have seen, but still you people do not accept our testimony.","I have spoken to you of earthly things and you do not believe; how then will you believe if I speak of heavenly things?","No one has ever gone into heaven except the one who came from heaven — the Son of Man.","Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up,","that everyone who believes may have eternal life in him.”","For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.","For God did not send his Son into the world to condemn the world, but to save the world through him.","Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God’s one and only Son.","This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil.","Everyone who does evil hates the light, and will not come into the light for fear that their deeds will be exposed.","But whoever lives by the truth comes into the light, so that it may be seen plainly that what they have done has been done in the sight of God.","After this, Jesus and his disciples went out into the Judean countryside, where he spent some time with them, and baptized.","Now John also was baptizing at Aenon near Salim, because there was plenty of water, and people were constantly coming to be baptized.","This was before John was put in prison.","An argument developed between some of John’s disciples and a certain Jew over the matter of ceremonial washing.","They came to John and said to him, “Rabbi, that man who was with you on the other side of the Jordan — the one you testified about — look, he is baptizing, and everyone is going to him.”","To this John replied, “A person can receive only what is given them from heaven.","You yourselves can testify that I said, ‘I am not the Messiah but am sent ahead of him.’","The bride belongs to the bridegroom. The friend who attends the bridegroom waits and listens for him, and is full of joy when he hears the bridegroom’s voice. That joy is mine, and it is now complete.","He must become greater; I must become less.”","The one who comes from above is above all; the one who is from the earth belongs to the earth, and speaks as one from the earth. The one who comes from heaven is above all.","He testifies to what he has seen and heard, but no one accepts his testimony.","Whoever has accepted it has certified that God is truthful.","For the one whom God has sent speaks the words of God, for God gives the Spirit without limit.","The Father loves the Son and has placed everything in his hands.","Whoever believes in the Son has eternal life, but whoever rejects the Son will not see life, for God’s wrath remains on them."],
"Philippians 4":["Therefore, my brothers and sisters, you whom I love and long for, my joy and crown, stand firm in the Lord in this way, dear friends!","I plead with Euodia and I plead with Syntyche to be of the same mind in the Lord.","Yes, and I ask you, my true companion, help these women since they have contended at my side in the cause of the gospel, along with Clement and the rest of my co-workers, whose names are in the book of life.","Rejoice in the Lord always. I will say it again: Rejoice!","Let your gentleness be evident to all. The Lord is near.","Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.","And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.","Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable — if anything is excellent or praiseworthy — think about such things.","Whatever you have learned or received or heard from me, or seen in me — put it into practice. And the God of peace will be with you.","I rejoiced greatly in the Lord that at last you renewed your concern for me. Indeed, you were concerned, but you had no opportunity to show it.","I am not saying this because I am in need, for I have learned to be content whatever the circumstances.","I know what it is to be in need, and I know what it is to have plenty. I have learned the secret of being content in any and every situation, whether well fed or hungry, whether living in plenty or in want.","I can do all this through him who gives me strength.","Yet it was good of you to share in my troubles.","Moreover, as you Philippians know, in the early days of your acquaintance with the gospel, when I set out from Macedonia, not one church shared with me in the matter of giving and receiving, except you only;","for even when I was in Thessalonica, you sent me aid more than once when I was in need.","Not that I desire your gifts; what I desire is that more be credited to your account.","I have received full payment and have more than enough. I am amply supplied, now that I have received from Epaphroditus the gifts you sent. They are a fragrant offering, an acceptable sacrifice, pleasing to God.","And my God will meet all your needs according to the riches of his glory in Christ Jesus.","To our God and Father be glory for ever and ever. Amen.","Greet all God’s people in Christ Jesus. The brothers and sisters who are with me send greetings.","All God’s people here send you greetings, especially those who belong to Caesar’s household.","The grace of the Lord Jesus Christ be with your spirit. Amen."],
"Romans 8":["Therefore, there is now no condemnation for those who are in Christ Jesus,","because through Christ Jesus the law of the Spirit who gives life has set you free from the law of sin and death.","For what the law was powerless to do because it was weakened by the flesh, God did by sending his own Son in the likeness of sinful flesh to be a sin offering. And so he condemned sin in the flesh,","in order that the righteous requirement of the law might be fully met in us, who do not live according to the flesh but according to the Spirit.","Those who live according to the flesh have their minds set on what the flesh desires; but those who live in accordance with the Spirit have their minds set on what the Spirit desires.","The mind governed by the flesh is death, but the mind governed by the Spirit is life and peace.","The mind governed by the flesh is hostile to God; it does not submit to God’s law, nor can it do so.","Those who are in the realm of the flesh cannot please God.","You, however, are not in the realm of the flesh but are in the realm of the Spirit, if indeed the Spirit of God lives in you. And if anyone does not have the Spirit of Christ, they do not belong to Christ.","But if Christ is in you, then even though your body is subject to death because of sin, the Spirit gives life because of righteousness.","And if the Spirit of him who raised Jesus from the dead is living in you, he who raised Christ from the dead will also give life to your mortal bodies because of his Spirit who lives in you.","Therefore, brothers and sisters, we have an obligation — but it is not to the flesh, to live according to it.","For if you live according to the flesh, you will die; but if by the Spirit you put to death the misdeeds of the body, you will live.","For those who are led by the Spirit of God are the children of God.","The Spirit you received does not make you slaves, so that you live in fear again; rather, the Spirit you received brought about your adoption to sonship. And by him we cry, “Abba, Father.”","The Spirit himself testifies with our spirit that we are God’s children.","Now if we are children, then we are heirs — heirs of God and co-heirs with Christ, if indeed we share in his sufferings in order that we may also share in his glory.","I consider that our present sufferings are not worth comparing with the glory that will be revealed in us.","For the creation waits in eager expectation for the children of God to be revealed.","For the creation was subjected to frustration, not by its own choice, but by the will of the one who subjected it, in hope","that the creation itself will be liberated from its bondage to decay and brought into the freedom and glory of the children of God.","We know that the whole creation has been groaning as in the pains of childbirth right up to the present time.","Not only so, but we ourselves, who have the firstfruits of the Spirit, groan inwardly as we wait eagerly for our adoption to sonship, the redemption of our bodies.","For in this hope we were saved. But hope that is seen is no hope at all. Who hopes for what they already have?","But if we hope for what we do not yet have, we wait for it patiently.","In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us through wordless groans.","And he who searches our hearts knows the mind of the Spirit, because the Spirit intercedes for God’s people in accordance with the will of God.","And we know that in all things God works for the good of those who love him, who have been called according to his purpose.","For those God foreknew he also predestined to be conformed to the image of his Son, that he might be the firstborn among many brothers and sisters.","And those he predestined, he also called; those he called, he also justified; those he justified, he also glorified.","What, then, shall we say in response to these things? If God is for us, who can be against us?","He who did not spare his own Son, but gave him up for us all — how will he not also, along with him, graciously give us all things?","Who will bring any charge against those whom God has chosen? It is God who justifies.","Who then is the one who condemns? No one. Christ Jesus who died — more than that, who was raised to life — is at the right hand of God and is also interceding for us.","Who shall separate us from the love of Christ? Shall trouble or hardship or persecution or famine or nakedness or danger or sword?","As it is written: “For your sake we face death all day long; we are considered as sheep to be slaughtered.”","No, in all these things we are more than conquerors through him who loved us.","For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,","neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."],
"Proverbs 3":["My son, do not forget my teaching, but keep my commands in your heart,","for they will prolong your life many years and bring you peace and prosperity.","Let love and faithfulness never leave you; bind them around your neck, write them on the tablet of your heart.","Then you will win favor and a good name in the sight of God and man.","Trust in the Lord with all your heart and lean not on your own understanding;","in all your ways submit to him, and he will make your paths straight.","Do not be wise in your own eyes; fear the Lord and shun evil.","This will bring health to your body and nourishment to your bones.","Honor the Lord with your wealth, with the firstfruits of all your crops;","then your barns will be filled to overflowing, and your vats will brim over with new wine.","My son, do not despise the Lord’s discipline, and do not resent his rebuke,","because the Lord disciplines those he loves, as a father the son he delights in.","Blessed are those who find wisdom, those who gain understanding,","for she is more profitable than silver and yields better returns than gold.","She is more precious than rubies; nothing you desire can compare with her.","Long life is in her right hand; in her left hand are riches and honor.","Her ways are pleasant ways, and all her paths are peace.","She is a tree of life to those who take hold of her; those who hold her fast will be blessed.","By wisdom the Lord laid the earth’s foundations, by understanding he set the heavens in place;","by his knowledge the watery depths were divided, and the clouds let drop the dew.","My son, do not let wisdom and understanding out of your sight, preserve sound judgment and discretion;","they will be life for you, an ornament to grace your neck.","Then you will go on your way in safety, and your foot will not stumble.","When you lie down, you will not be afraid; when you lie down, your sleep will be sweet.","Have no fear of sudden disaster or of the ruin that overtakes the wicked,","for the Lord will be at your side and will keep your foot from being caught in a trap.","Do not withhold good from those to whom it is due, when it is in your power to act.","Do not say to your neighbor, “Come back tomorrow and I’ll give it to you” — when you already have it with you.","Do not plot harm against your neighbor, who lives trustfully near you.","Do not accuse anyone for no reason — when they have done you no harm.","Do not envy the violent or choose any of their ways.","For the Lord detests the perverse but takes the upright into his confidence.","The Lord’s curse is on the house of the wicked, but he blesses the home of the righteous.","He mocks proud mockers but shows favor to the humble and oppressed.","The wise inherit honor, but fools get only shame."],
"Isaiah 40":["Comfort, comfort my people, says your God.","Speak tenderly to Jerusalem, and proclaim to her that her hard service has been completed, that her sin has been paid for, that she has received from the Lord’s hand double for all her sins.","A voice of one calling: “In the wilderness prepare the way for the Lord; make straight in the desert a highway for our God.","Every valley shall be raised up, every mountain and hill made low; the rough ground shall become level, the rugged places a plain.","And the glory of the Lord will be revealed, and all people will see it together. For the mouth of the Lord has spoken.”","A voice says, “Cry out.” And I said, “What shall I cry?” “All people are like grass, and all their faithfulness is like the flowers of the field.","The grass withers and the flowers fall, because the breath of the Lord blows on them. Surely the people are grass.","The grass withers and the flowers fall, but the word of our God endures forever.”","You who bring good news to Zion, go up on a high mountain. You who bring good news to Jerusalem, lift up your voice with a shout, lift it up, do not be afraid; say to the towns of Judah, “Here is your God!”","See, the Sovereign Lord comes with power, and he rules with a mighty arm. See, his reward is with him, and his recompense accompanies him.","He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart; he gently leads those that have young.","Who has measured the waters in the hollow of his hand, or with the breadth of his hand marked off the heavens? Who has held the dust of the earth in a basket, or weighed the mountains on the scales and the hills in a balance?","Who can fathom the Spirit of the Lord, or instruct the Lord as his counselor?","Whom did the Lord consult to enlighten him, and who taught him the right way? Who was it that taught him knowledge, or showed him the path of understanding?","Surely the nations are like a drop in a bucket; they are regarded as dust on the scales; he weighs the islands as though they were fine dust.","Lebanon is not sufficient for altar fires, nor its animals enough for burnt offerings.","Before him all the nations are as nothing; they are regarded by him as worthless and less than nothing.","With whom, then, will you compare God? To what image will you liken him?","As for an idol, a metalworker casts it, and a goldsmith overlays it with gold and fashions silver chains for it.","A person too poor to present such an offering selects wood that will not rot; they look for a skilled worker to set up an idol that will not topple.","Do you not know? Have you not heard? Has it not been told you from the beginning? Have you not understood since the earth was founded?","He sits enthroned above the circle of the earth, and its people are like grasshoppers. He stretches out the heavens like a canopy, and spreads them out like a tent to live in.","He brings princes to naught and reduces the rulers of this world to nothing.","No sooner are they planted, no sooner are they sown, no sooner do they take root in the ground, than he blows on them and they wither, and a whirlwind sweeps them away like chaff.","“To whom will you compare me? Or who is my equal?” says the Holy One.","Lift up your eyes and look to the heavens: Who created all these? He who brings out the starry host one by one and calls forth each of them by name. Because of his great power and mighty strength, not one of them is missing.","Why do you complain, Jacob? Why do you say, Israel, “My way is hidden from the Lord; my cause is disregarded by my God”?","Do you not know? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth. He will not grow tired or weary, and his understanding no one can fathom.","He gives strength to the weary and increases the power of the weak.","Even youths grow tired and weary, and young men stumble and fall;","but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."],
"Matthew 5":["Now when Jesus saw the crowds, he went up on a mountainside and sat down. His disciples came to him,","and he began to teach them. He said:","“Blessed are the poor in spirit, for theirs is the kingdom of heaven.","Blessed are those who mourn, for they will be comforted.","Blessed are the meek, for they will inherit the earth.","Blessed are those who hunger and thirst for righteousness, for they will be filled.","Blessed are the merciful, for they will be shown mercy.","Blessed are the pure in heart, for they will see God.","Blessed are the peacemakers, for they will be called children of God.","Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.","Blessed are you when people insult you, persecute you and falsely say all kinds of evil against you because of me.","Rejoice and be glad, because great is your reward in heaven, for in the same way they persecuted the prophets who were before you.","You are the salt of the earth. But if the salt loses its saltiness, how can it be made salty again? It is no longer good for anything, except to be thrown out and trampled underfoot.","You are the light of the world. A town built on a hill cannot be hidden.","Neither do people light a lamp and put it under a bowl. Instead they put it on its stand, and it gives light to everyone in the house.","In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.","Do not think that I have come to abolish the Law or the Prophets; I have not come to abolish them but to fulfill them.","For truly I tell you, until heaven and earth disappear, not the smallest letter, not the least stroke of a pen, will by any means disappear from the Law until everything is accomplished.","Therefore anyone who sets aside one of the least of these commands and teaches others accordingly will be called least in the kingdom of heaven, but whoever practices and teaches these commands will be called great in the kingdom of heaven.","For I tell you that unless your righteousness surpasses that of the Pharisees and the teachers of the law, you will certainly not enter the kingdom of heaven.","You have heard that it was said to the people long ago, ‘You shall not murder, and anyone who murders will be subject to judgment.’","But I tell you that anyone who is angry with a brother or sister will be subject to judgment.","Therefore, if you are offering your gift at the altar and there remember that your brother or sister has something against you,","leave your gift there in front of the altar. First go and be reconciled to them; then come and offer your gift.","Settle matters quickly with your adversary who is taking you to court.","You have heard that it was said, ‘You shall not commit adultery.’","But I tell you that anyone who looks at a woman lustfully has already committed adultery with her in his heart.","If your right eye causes you to stumble, gouge it out and throw it away. It is better for you to lose one part of your body than for your whole body to be thrown into hell.","And if your right hand causes you to stumble, cut it off and throw it away. It is better for you to lose one part of your body than for your whole body to go into hell.","It has been said, ‘Anyone who divorces his wife must give her a certificate of divorce.’","But I tell you that anyone who divorces his wife, except for sexual immorality, makes her the victim of adultery, and anyone who marries a divorced woman commits adultery.","Again, you have heard that it was said to the people long ago, ‘Do not break your oath, but fulfill to the Lord the vows you have made.’","But I tell you, do not swear an oath at all: either by heaven, for it is God’s throne;","or by the earth, for it is his footstool; or by Jerusalem, for it is the city of the Great King.","And do not swear by your head, for you cannot make even one hair white or black.","All you need to say is simply ‘Yes’ or ‘No’; anything beyond this comes from the evil one.","You have heard that it was said, ‘Eye for eye, and tooth for tooth.’","But I tell you, do not resist an evil person. If anyone slaps you on the right cheek, turn to them the other cheek also.","And if anyone wants to sue you and take your shirt, hand over your coat as well.","If anyone forces you to go one mile, go with them two miles.","Give to the one who asks you, and do not turn away from the one who wants to borrow from you.","You have heard that it was said, ‘Love your neighbor and hate your enemy.’","But I tell you, love your enemies and pray for those who persecute you,","that you may be children of your Father in heaven. He causes his sun to rise on the evil and the good, and sends rain on the righteous and the unrighteous.","If you love those who love you, what reward will you get? Are not even the tax collectors doing that?","And if you greet only your own people, what are you doing more than others? Do not even pagans do that?","Be perfect, therefore, as your heavenly Father is perfect."],
"Jeremiah 29":["This is the text of the letter that the prophet Jeremiah sent from Jerusalem to the surviving elders among the exiles and to the priests, the prophets and all the other people Nebuchadnezzar had carried into exile from Jerusalem to Babylon.","This was after King Jehoiachin and the queen mother, the court officials and the leaders of Judah and Jerusalem, the skilled workers and the artisans had gone into exile from Jerusalem.","He entrusted the letter to Elasah son of Shaphan and to Gemariah son of Hilkiah, whom Zedekiah king of Judah sent to King Nebuchadnezzar in Babylon. It said:","This is what the Lord Almighty, the God of Israel, says to all those I carried into exile from Jerusalem to Babylon:","“Build houses and settle down; plant gardens and eat what they produce.","Marry and have sons and daughters; find wives for your sons and give your daughters in marriage, so that they too may have sons and daughters. Increase in number there; do not decrease.","Also, seek the peace and prosperity of the city to which I have carried you into exile. Pray to the Lord for it, because if it prospers, you too will prosper.”","Yes, this is what the Lord Almighty, the God of Israel, says: “Do not let the prophets and diviners among you deceive you. Do not listen to the dreams you encourage them to have.","They are prophesying lies to you in my name. I have not sent them,” declares the Lord.","This is what the Lord says: “When seventy years are completed for Babylon, I will come to you and fulfill my good promise to bring you back to this place.","For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.","Then you will call on me and come and pray to me, and I will listen to you.","You will seek me and find me when you seek me with all your heart.","I will be found by you,” declares the Lord, “and will bring you back from captivity. I will gather you from all the nations and places where I have banished you,” declares the Lord, “and will bring you back to the place from which I carried you into exile.”"],
"Psalm 121":["I lift up my eyes to the mountains — where does my help come from?","My help comes from the Lord, the Maker of heaven and earth.","He will not let your foot slip — he who watches over you will not slumber;","indeed, he who watches over Israel will neither slumber nor sleep.","The Lord watches over you — the Lord is your shade at your right hand;","the sun will not harm you by day, nor the moon by night.","The Lord will keep you from all harm — he will watch over your life;","the Lord will watch over your coming and going both now and forevermore."],
"Psalm 46":["God is our refuge and strength, an ever-present help in trouble.","Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea,","though its waters roar and foam and the mountains quake with their surging.","There is a river whose streams make glad the city of God, the holy place where the Most High dwells.","God is within her, she will not fall; God will help her at break of day.","Nations are in uproar, kingdoms fall; he lifts his voice, the earth melts.","The Lord Almighty is with us; the God of Jacob is our fortress.","Come and see what the Lord has done, the desolations he has brought on the earth.","He makes wars cease to the ends of the earth. He breaks the bow and shatters the spear; he burns the shields with fire.","He says, “Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.”","The Lord Almighty is with us; the God of Jacob is our fortress."],
"Psalm 100":["Shout for joy to the Lord, all the earth.","Worship the Lord with gladness; come before him with joyful songs.","Know that the Lord is God. It is he who made us, and we are his; we are his people, the sheep of his pasture.","Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.","For the Lord is good and his love endures forever; his faithfulness continues through all generations."],
"Psalm 19":["The heavens declare the glory of God; the skies proclaim the work of his hands.","Day after day they pour forth speech; night after night they reveal knowledge.","They have no speech, they use no words; no sound is heard from them.","Yet their voice goes out into all the earth, their words to the ends of the world. In the heavens God has pitched a tent for the sun.","It is like a bridegroom coming out of his chamber, like a champion rejoicing to run his course.","It rises at one end of the heavens and makes its circuit to the other; nothing is deprived of its warmth.","The law of the Lord is perfect, refreshing the soul. The statutes of the Lord are trustworthy, making wise the simple.","The precepts of the Lord are right, giving joy to the heart. The commands of the Lord are radiant, giving light to the eyes.","The fear of the Lord is pure, enduring forever. The decrees of the Lord are firm, and all of them are righteous.","They are more precious than gold, than much pure gold; they are sweeter than honey, than honey from the honeycomb.","By them your servant is warned; in keeping them there is great reward.","But who can discern their own errors? Forgive my hidden faults.","Keep your servant also from willful sins; may they not rule over me. Then I will be blameless, innocent of great transgression.","May these words of my mouth and this meditation of my heart be pleasing in your sight, Lord, my Rock and my Redeemer."],
"Romans 12":["Therefore, I urge you, brothers and sisters, in view of God’s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God — this is your true and proper worship.","Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God’s will is — his good, pleasing and perfect will.","For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you.","For just as each of us has one body with many members, and these members do not all have the same function,","so in Christ we, though many, form one body, and each member belongs to all the others.","We have different gifts, according to the grace given to each of us. If your gift is prophesying, then prophesy in accordance with your faith;","if it is serving, then serve; if it is teaching, then teach;","if it is to encourage, then give encouragement; if it is giving, then give generously; if it is to lead, do it diligently; if it is to show mercy, do it cheerfully.","Love must be sincere. Hate what is evil; cling to what is good.","Be devoted to one another in love. Honor one another above yourselves.","Never be lacking in zeal, but keep your spiritual fervor, serving the Lord.","Be joyful in hope, patient in affliction, faithful in prayer.","Share with the Lord’s people who are in need. Practice hospitality.","Bless those who persecute you; bless and do not curse.","Rejoice with those who rejoice; mourn with those who mourn.","Live in harmony with one another. Do not be proud, but be willing to associate with people of low position. Do not be conceited.","Do not repay anyone evil for evil. Be careful to do what is right in the eyes of everyone.","If it is possible, as far as it depends on you, live at peace with everyone.","Do not take revenge, my dear friends, but leave room for God’s wrath, for it is written: “It is mine to avenge; I will repay,” says the Lord.","On the contrary: “If your enemy is hungry, feed him; if he is thirsty, give him something to drink. In doing this, you will heap burning coals on his head.”","Do not be overcome by evil, but overcome evil with good."],
};
const PLAN=[
{day:1,title:"Begin Again",ref:"Genesis 1",note:"Creation — you are made with intention."},
{day:2,title:"A Shepherd’s Peace",ref:"Psalm 23",note:"Rest — you lack nothing with God."},
{day:3,title:"Wisdom for the Road",ref:"Proverbs 3",note:"Trust — lean into God’s guidance."},
{day:4,title:"Born Again",ref:"John 3",note:"New life — loved beyond measure."},
{day:5,title:"No Condemnation",ref:"Romans 8",note:"Freedom — nothing separates you."},
{day:6,title:"The Greatest Gift",ref:"1 Corinthians 13",note:"Love — the way that never fails."},
{day:7,title:"Strength to Soar",ref:"Isaiah 40",note:"Renewal — hope lifts weary wings."},
];
const COLORS=[{n:"yellow",c:"#ffe58a"},{n:"green",c:"#b7e8c2"},{n:"blue",c:"#bcd7ff"},{n:"pink",c:"#ffc7dd"}];
function dayOfYear(d=new Date()){const s=new Date(d.getFullYear(),0,0);return Math.floor((d.getTime()-s.getTime())/86400000)}
function copyText(t:string){const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta)}
function speak(t:string){try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=.92;window.speechSynthesis.speak(u)}catch{}}

function InfoReturn({onReturn}:{onReturn:()=>void}){
  return <button onClick={onReturn} className="btn px-4 py-2.5 border flex gap-2 items-center text-sm font-bold" style={{borderColor:"var(--line)",background:"var(--surface)"}}><ArrowLeft size={15}/> Return to Bible Randomizer</button>;
}
function InfoShell({eyebrow,title,lastUpdated,children,onReturn}:{eyebrow?:string;title:string;lastUpdated?:string;children:React.ReactNode;onReturn:()=>void}){
  return (
    <section className="mt-6 max-w-[860px] mx-auto">
      <InfoReturn onReturn={onReturn}/>
      <article className="card p-6 sm:p-9 mt-4">
        {eyebrow&&<p className="text-[11px] tracking-[.2em] uppercase font-bold opacity-60">{eyebrow}</p>}
        <h2 className="serif text-[32px] sm:text-[42px] font-black leading-tight mt-2">{title}</h2>
        {lastUpdated&&<p className="text-[13px] font-bold mt-2 opacity-70">{lastUpdated}</p>}
        <div className="info-body mt-5 space-y-6 text-[15px] leading-[1.75] opacity-90">{children}</div>
      </article>
      <div className="mt-4"><InfoReturn onReturn={onReturn}/></div>
    </section>
  );
}
function InfoToc({items}:{items:{id:string;label:string}[]}){
  return (
    <nav aria-label="Table of contents" className="p-5 rounded-2xl border" style={{borderColor:"var(--line)",background:"var(--surface2)"}}>
      <p className="font-black text-[15px]">On this page</p>
      <ol className="mt-2 space-y-1.5 list-decimal ml-5 text-[14px]">{items.map(it=><li key={it.id}><a className="font-semibold underline" style={{color:"var(--gold)"}} href={`#${it.id}`}>{it.label}</a></li>)}</ol>
    </nav>
  );
}
function InfoH({id,children}:{id?:string;children:React.ReactNode}){
  return <h3 id={id} className="font-black text-[21px] serif leading-snug">{children}</h3>;
}
function InfoSub({children}:{children:React.ReactNode}){
  return <h4 className="font-black text-[17px] mt-4">{children}</h4>;
}
function EmailLink(){ return <a className="font-bold underline" style={{color:"var(--gold)"}} href="mailto:contact@biblerandomizer.com">contact@biblerandomizer.com</a>; }
function SiteLink(){ return <a className="font-bold underline" style={{color:"var(--gold)"}} href="https://biblerandomizer.com" target="_blank" rel="noopener">https://biblerandomizer.com</a>; }

export default function App(){
  const [theme,setTheme]=useState<Theme>("light");
  const [sans,setSans]=useState(false);
  const [tab,setTab]=useState<Tab>("random");
  const isInfoPage=tab==="about"||tab==="contact"||tab==="privacy"||tab==="terms";
  const goTo=(t:Tab)=>{setTab(t);window.scrollTo({top:0,behavior:"smooth"})};
  const returnToApp=()=>goTo("random");
  const [fontSize,setFontSize]=useState(19);
  const [testament,setTestament]=useState<"All"|"Old"|"New">("All");
  const [search,setSearch]=useState("");
  const [searchMsg,setSearchMsg]=useState("");
  const [current,setCurrent]=useState({book:"John",chapter:3});
  const [spinning,setSpinning]=useState(false);
  const [verseIdx,setVerseIdx]=useState(2);
  const [topicSel,setTopicSel]=useState("All Topics");
  const [topicSearch,setTopicSearch]=useState("");
  const [verseHistory,setVerseHistory]=useState<number[]>([2]);
  const [verseSeen,setVerseSeen]=useState(1);
  const [verseAnimKey,setVerseAnimKey]=useState(0);
  const [moodSel,setMoodSel]=useState(MOODS[0]);
  const [moodSlots,setMoodSlots]=useState<number[]>([0,1,2]);
  const [moodAnimKeys,setMoodAnimKeys]=useState<number[]>([0,0,0]);
  const [moodOrigin,setMoodOrigin]=useState<{mood:string;ref:string;text:string;book:string;chapter:number;verse:number}|null>(null);
  const [memDiff,setMemDiff]=useState<"Easy"|"Medium"|"Hard">("Medium");
  const [memIdx,setMemIdx]=useState(0);
  const [memRevealed,setMemRevealed]=useState(false);
  const [memResult,setMemResult]=useState("");
  const [memRound,setMemRound]=useState(0);
  const [memShuffle,setMemShuffle]=useState(0);
  const [memFilled,setMemFilled]=useState<(string|null)[]>([]);
  const [memBonusGiven,setMemBonusGiven]=useState(false);
  const [memStats,setMemStats]=useState({points:0,rounds:0,correct:0,attempted:0,streak:0,bestStreak:0,lastDate:""});
  const [memStatsLoaded,setMemStatsLoaded]=useState(false);
  const [confetti,setConfetti]=useState<number[]>([]);
  const [toast,setToast]=useState("");
  const [showNote,setShowNote]=useState<string|null>(null);
  const [noteText,setNoteText]=useState("");
  const [highlightPick,setHighlightPick]=useState<string|null>(null);
  const [saved,setSaved]=useState<Verse[]>([]);
  const [readChapters,setReadChapters]=useState<string[]>(["John 3","Psalm 23"]);
  const [notes,setNotes]=useState<Note[]>([]);
  const [highlights,setHighlights]=useState<Highlight[]>([]);
  const [bookmarks,setBookmarks]=useState<string[]>(["Psalm 23"]);
  const [streak,setStreak]=useState(3);
  const [ids,setIds]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState("");
  const [planDone,setPlanDone]=useState<number[]>([1]);
  const [planIds,setPlanIds]=useState<Record<string,string>>({});
  const [expandedBook,setExpandedBook]=useState<string|null>(null);
  const [trackerFilter,setTrackerFilter]=useState<"All"|"Old"|"New"|"Started"|"Completed"|"Not Started">("All");
  const [trackerSort,setTrackerSort]=useState<"Order"|"Progress"|"A-Z">("Order");
  const [bookSearch,setBookSearch]=useState("");
  const [favRefs,setFavRefs]=useState<string[]>([]);
  const [favColors,setFavColors]=useState<Record<string,string>>({});
  const [manualFavs,setManualFavs]=useState<Verse[]>([]);
  const [readHistory,setReadHistory]=useState<{key:string;ts:number}[]>([]);
  const [dailyGoal,setDailyGoal]=useState(3);
  const [manualRef,setManualRef]=useState("");
  const [manualText,setManualText]=useState("");
  const [manualColor,setManualColor]=useState("gold");
  const [showResetConfirm,setShowResetConfirm]=useState(false);
  const [showSummary,setShowSummary]=useState(false);
  const [undoStack,setUndoStack]=useState<{key:string;wasRead:boolean}[]>([]);
  const readerRef=useRef<HTMLDivElement>(null);

  const showToast=(t:string)=>{setToast(t);setTimeout(()=>setToast(""),2600)};
  const persist=async(coll:string, value:any)=>{
    setSaving(true);setSaveError("");
    try{
      const id=ids[coll];
      if(id){await api("records.replace",{collection:coll,id,value});}
      else{const rec=await api("records.create",{collection:coll,value,idempotency_key:`${coll}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}); if(rec?.id) setIds(p=>({...p,[coll]:rec.id}));}
    }catch(e:any){setSaveError(e.message||"Could not save yet — your reading is still shown here.");}
    setSaving(false);
  };
  useEffect(()=>{(async()=>{
    const s=await loadColl("bible_saved"); if(s){setIds(p=>({...p,bible_saved:s.id})); if(Array.isArray(s.value?.items)) setSaved(s.value.items);}
    const p=await loadColl("bible_progress"); if(p){setIds(x=>({...x,bible_progress:p.id})); if(Array.isArray(p.value?.read)) setReadChapters(p.value.read); if(typeof p.value?.streak==="number") setStreak(p.value.streak); if(Array.isArray(p.value?.history)) setReadHistory(p.value.history.filter((h:any)=>h&&typeof h.key==="string"&&typeof h.ts==="number")); if(typeof p.value?.goal==="number") setDailyGoal(p.value.goal);}
    const f=await loadColl("bible_favorites"); if(f){setIds(x=>({...x,bible_favorites:f.id})); if(Array.isArray(f.value?.refs)) setFavRefs(f.value.refs); if(f.value?.colors&&typeof f.value.colors==="object") setFavColors(f.value.colors); if(Array.isArray(f.value?.manual)) setManualFavs(f.value.manual.filter((v:any)=>v&&typeof v.ref==="string"&&typeof v.text==="string"));}
    const n=await loadColl("bible_notes"); if(n){setIds(x=>({...x,bible_notes:n.id})); if(Array.isArray(n.value?.items)) setNotes(n.value.items);}
    const h=await loadColl("bible_highlights"); if(h){setIds(x=>({...x,bible_highlights:h.id})); if(Array.isArray(h.value?.items)) setHighlights(h.value.items);}
    const b=await loadColl("bible_bookmarks"); if(b){setIds(x=>({...x,bible_bookmarks:b.id})); if(Array.isArray(b.value?.items)) setBookmarks(b.value.items);}
    const pl=await loadColl("bible_plan"); if(pl){setIds(x=>({...x,bible_plan:pl.id})); if(Array.isArray(pl.value?.done)) setPlanDone(pl.value.done);}
    const mm=await loadColl("bible_memorize"); if(mm){setIds(x=>({...x,bible_memorize:mm.id})); const v=mm.value||{}; setMemStats({points:typeof v.points==="number"?v.points:0,rounds:typeof v.rounds==="number"?v.rounds:0,correct:typeof v.correct==="number"?v.correct:0,attempted:typeof v.attempted==="number"?v.attempted:0,streak:typeof v.streak==="number"?v.streak:0,bestStreak:typeof v.bestStreak==="number"?v.bestStreak:0,lastDate:typeof v.lastDate==="string"?v.lastDate:""});}
    setMemStatsLoaded(true);
  })()},[]);
  const todayVerse=VERSES[dayOfYear()%VERSES.length];
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
  const tomorrow=new Date(now); tomorrow.setHours(24,0,0,0);
  const diff=tomorrow.getTime()-now.getTime(); const hh=String(Math.floor(diff/3600000)).padStart(2,"0"); const mm=String(Math.floor(diff%3600000/60000)).padStart(2,"0"); const ss=String(Math.floor(diff%60000/1000)).padStart(2,"0");

  const bookInfo=BOOKS.find(b=>b.name===current.book)!;
  const chapterKey=`${current.book} ${current.chapter}`;
  const chapterText=getChapterLines(current.book,current.chapter)||[
    `This chapter opens a new part of the story of ${current.book}. Read it slowly, listening for what God is doing among his people.`,
    `In these opening verses, the scene is set with care and purpose — people, place, and promise coming together.`,
    `Notice the words that repeat. In Scripture, repetition is often an invitation to pay attention.`,
    `As the chapter unfolds, watch for God’s character: faithful, patient, just, and merciful.`,
    `Carry one line from this chapter into your day, and let it shape how you speak and act.`,
  ];
  const isFull=!!getChapterLines(current.book,current.chapter);
  const moodTargetVerse=moodOrigin&&moodOrigin.book===current.book&&moodOrigin.chapter===current.chapter?moodOrigin.verse:null;
  const favBook=useMemo(()=>{const c:Record<string,number>={};readChapters.forEach(r=>{const b=r.replace(/ \d+$/,"");c[b]=(c[b]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||"John"},[readChapters]);

  const fireConfetti=()=>{setConfetti(Array.from({length:42},(_,i)=>i));setTimeout(()=>setConfetti([]),2800)};
  const spin=(preferFull=true)=>{
    if(spinning) return; setSpinning(true); setMoodOrigin(null);
    const fullKeys=Object.keys(CHAPTERS);
    setTimeout(()=>{
      let key:string;
      if(preferFull && Math.random()<0.72){key=fullKeys[Math.floor(Math.random()*fullKeys.length)]; const m=key.match(/(.+?) (\d+)$/)!; setCurrent({book:m[1],chapter:Number(m[2])});}
      else{const pool=BOOKS.filter(b=>testament==="All"||b.test===testament); const b=pool[Math.floor(Math.random()*pool.length)]; const ch=1+Math.floor(Math.random()*b.chapters); setCurrent({book:b.name,chapter:ch});}
      setSpinning(false); setTab("random");
      setTimeout(()=>readerRef.current?.scrollIntoView({behavior:"smooth"}),80);
    },720);
  };
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.code==="Space" && (e.target as HTMLElement)?.tagName!=="INPUT" && (e.target as HTMLElement)?.tagName!=="TEXTAREA"){e.preventDefault();spin()}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[spinning,testament]);

  const markRead=async()=>{ await markChapterKey(chapterKey); };
  const parseChapterKey=(k:string)=>{const m=k.match(/(.+?) (\d+)$/); return m?{book:m[1],chapter:Number(m[2])}:null};
  const persistProgress=async(read:string[],stk:number,hist:{key:string;ts:number}[],goal:number)=>{await persist("bible_progress",{read,streak:stk,history:hist,goal});};
  const persistFavorites=async(refs:string[],colors:Record<string,string>,manual:Verse[])=>{await persist("bible_favorites",{refs,colors,manual});};
  const markChapterKey=async(key:string,opts:{silent?:boolean}={})=>{
    if(readChapters.includes(key)){ if(!opts.silent) showToast("Already in your reading history ✓"); return; }
    const next=[...readChapters,key]; const nextHist=[...readHistory,{key,ts:Date.now()}]; setReadChapters(next); setReadHistory(nextHist); setUndoStack(prev=>[...prev,{key,wasRead:false}]); const ns=streak+1; setStreak(ns);
    const parsed=parseChapterKey(key); let finished=false; if(parsed){const b=BOOKS.find(x=>x.name===parsed.book); if(b){const cnt=next.filter(r=>r.startsWith(b.name+" ")).length; if(cnt===b.chapters) finished=true;}}
    if(finished){fireConfetti(); showToast(`You finished ${parsed?.book}! 🎉`);} else if(!opts.silent){showToast(`Marked ${key} as read ✓`);}
    await persistProgress(next,ns,nextHist,dailyGoal);
  };
  const unmarkChapterKey=async(key:string)=>{
    if(!readChapters.includes(key)) return; const next=readChapters.filter(x=>x!==key); setReadChapters(next); setUndoStack(prev=>[...prev,{key,wasRead:true}]); showToast(`Marked ${key} as unread`); await persistProgress(next,streak,readHistory,dailyGoal);
  };
  const toggleChapterKey=async(key:string)=>{ if(readChapters.includes(key)) await unmarkChapterKey(key); else await markChapterKey(key); };
  const undoLastMark=async()=>{
    const last=undoStack[undoStack.length-1]; if(!last){showToast("Nothing to undo");return;}
    const rest=undoStack.slice(0,-1); setUndoStack(rest);
    if(!last.wasRead){ const next=readChapters.filter(x=>x!==last.key); setReadChapters(next); showToast(`Undid — ${last.key} marked as unread`); await persistProgress(next,streak,readHistory,dailyGoal); }
    else if(!readChapters.includes(last.key)){ const next=[...readChapters,last.key]; const nextHist=[...readHistory,{key:last.key,ts:Date.now()}]; setReadChapters(next); setReadHistory(nextHist); showToast(`Undid — ${last.key} marked as read again`); await persistProgress(next,streak,nextHist,dailyGoal); }
  };
  const openChapterKey=(key:string)=>{ const parsed=parseChapterKey(key); if(!parsed) return; setCurrent({book:parsed.book,chapter:parsed.chapter}); setTab("random"); setTimeout(()=>readerRef.current?.scrollIntoView({behavior:"smooth"}),100); };
  const spinRandomUnread=()=>{ const unread:string[]=[]; BOOKS.forEach(b=>{for(let i=1;i<=b.chapters;i++){const k=`${b.name} ${i}`; if(!readChapters.includes(k)) unread.push(k);}}); if(!unread.length){showToast("You have read every chapter! 🎉");return;} const pick=unread[Math.floor(Math.random()*unread.length)]; showToast(`Random unread: ${pick}`); openChapterKey(pick); };
  const markAllInBook=async(b:{name:string;chapters:number})=>{ const missing=Array.from({length:b.chapters},(_,i)=>`${b.name} ${i+1}`).filter(k=>!readChapters.includes(k)); if(!missing.length){showToast(`${b.name} is already complete ✓`);return;} const next=[...readChapters,...missing]; const nextHist=[...readHistory,...missing.map(k=>({key:k,ts:Date.now()}))]; setReadChapters(next); setReadHistory(nextHist); const ns=streak+1; setStreak(ns); fireConfetti(); showToast(`You finished ${b.name}! 🎉`); await persistProgress(next,ns,nextHist,dailyGoal); };
  const toggleFavorite=async(ref:string)=>{ const next=favRefs.includes(ref)?favRefs.filter(x=>x!==ref):[...favRefs,ref]; setFavRefs(next); showToast(favRefs.includes(ref)?"Removed from favorites":"Pinned as favorite ★"); await persistFavorites(next,favColors,manualFavs); };
  const setFavoriteColor=async(ref:string,color:string)=>{ const next={...favColors,[ref]:color}; setFavColors(next); await persistFavorites(favRefs,next,manualFavs); };
  const addManualFav=async()=>{ if(!manualRef.trim()||!manualText.trim()){showToast("Enter both a reference and verse text");return;} const v:Verse={text:manualText.trim(),ref:manualRef.trim(),cat:"Favorite"}; if(manualFavs.some(x=>x.ref===v.ref)||saved.some(x=>x.ref===v.ref)){showToast("That verse is already in favorites");return;} const next=[...manualFavs,v]; setManualFavs(next); const nextColors={...favColors,[v.ref]:manualColor}; setFavColors(nextColors); const nextRefs=favRefs.includes(v.ref)?favRefs:[...favRefs,v.ref]; setFavRefs(nextRefs); setManualRef(""); setManualText(""); showToast("Favorite verse added ★"); await persistFavorites(nextRefs,nextColors,next); };
  const removeFavVerse=async(ref:string)=>{ if(manualFavs.some(x=>x.ref===ref)){ const next=manualFavs.filter(x=>x.ref!==ref); setManualFavs(next); await persistFavorites(favRefs.filter(x=>x!==ref),favColors,next); } else { await removeSaved(ref); } showToast("Favorite verse removed"); };
  const readFavInContext=(v:Verse)=>{ const parsed=parseVerseRef(v.ref); if(!parsed) return; setMoodOrigin({mood:"Favorite",ref:v.ref,text:v.text,book:parsed.book,chapter:parsed.chapter,verse:parsed.verse}); setCurrent({book:parsed.book,chapter:parsed.chapter}); setTab("random"); };
  const clearHistoryFn=async()=>{ setReadHistory([]); setUndoStack([]); showToast("Reading history cleared"); await persistProgress(readChapters,streak,[],dailyGoal); };
  const changeGoal=async(g:number)=>{ setDailyGoal(g); await persistProgress(readChapters,streak,readHistory,g); showToast(`Daily goal set to ${g} chapter${g>1?"s":""} / day`); };
  const resetTrackerFn=async()=>{ setReadChapters([]); setReadHistory([]); setUndoStack([]); setStreak(0); setPlanDone([]); setShowResetConfirm(false); showToast("Tracker reset — fresh start"); await persistProgress([],0,[],dailyGoal); await persist("bible_plan",{done:[]}); };
  useEffect(()=>{ if(tab!=="random") return; if(readChapters.includes(chapterKey)) return; let done=false; const t=setTimeout(()=>{ if(!done) markChapterKey(chapterKey); },20000); const onScroll=()=>{ const nearBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-140; if(nearBottom&&!done){done=true; markChapterKey(chapterKey);} }; window.addEventListener("scroll",onScroll,{passive:true}); return()=>{done=true; clearTimeout(t); window.removeEventListener("scroll",onScroll);}; },[tab,current.book,current.chapter,readChapters]);
  const toggleBookmark=async()=>{
    const has=bookmarks.includes(chapterKey); const next=has?bookmarks.filter(x=>x!==chapterKey):[...bookmarks,chapterKey]; setBookmarks(next); showToast(has?"Bookmark removed":"Chapter bookmarked"); await persist("bible_bookmarks",{items:next});
  };
  const saveVerse=async(v:Verse)=>{if(saved.some(s=>s.ref===v.ref)){showToast("Already saved");return} const next=[...saved,v]; setSaved(next); showToast("Verse saved to your library"); await persist("bible_saved",{items:next})};
  const removeSaved=async(ref:string)=>{const next=saved.filter(s=>s.ref!==ref); setSaved(next); await persist("bible_saved",{items:next})};
  const addNote=async()=>{
    if(!noteText.trim()||!showNote) return; const n={id:String(Date.now()),ref:showNote,text:noteText.trim(),date:new Date().toLocaleDateString()}; const next=[...notes,n]; setNotes(next); setNoteText(""); setShowNote(null); showToast("Note saved"); await persist("bible_notes",{items:next});
  };
  const setHighlight=async(ref:string,color:string)=>{
    const next=[...highlights.filter(h=>h.ref!==ref),{ref,color}]; setHighlights(next); setHighlightPick(null); showToast("Verse highlighted"); await persist("bible_highlights",{items:next});
  };
  const clearAll=async()=>{
    // Keep existing records intact per persistence rules — clear only local view by replacing with empty values via API
    setSaving(true);
    try{ await persist("bible_saved",{items:[]}); await persist("bible_notes",{items:[]}); await persist("bible_highlights",{items:[]}); await persist("bible_bookmarks",{items:[]}); await persist("bible_progress",{read:[],streak:0}); setSaved([]);setNotes([]);setHighlights([]);setBookmarks([]);setReadChapters([]);setStreak(0); showToast("Library cleared — fresh start"); }
    catch{ showToast("Could not clear saved data — please try again"); } setSaving(false);
  };
  const doSearch=()=>{
    const q=search.trim(); if(!q){setSearchMsg("Try “John 3”, “Psalm 23”, or “Romans 8”.");return}
    const m=q.match(/^(.+?)\s+(\d+)$/); const namePart=m?m[1].toLowerCase():q.toLowerCase(); const ch=m?Number(m[2]):1;
    const found=BOOKS.find(b=>b.name.toLowerCase()===namePart||b.name.toLowerCase().startsWith(namePart));
    if(!found){setSearchMsg(`Couldn’t find “${q}”. Try a book name like John or Psalm.`);return}
    if(ch<1||ch>found.chapters){setSearchMsg(`${found.name} has ${found.chapters} chapters.`);return}
    setCurrent({book:found.name,chapter:ch}); setTab("random"); setSearchMsg(`Jumped to ${found.name} ${ch} ✓`); setTimeout(()=>readerRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };
  const memVerse=VERSES[memIdx%VERSES.length];
  const memTargetCount=memDiff==="Easy"?3:memDiff==="Medium"?6:10;
  const memHiddenIdx=useMemo(()=>{const words=memVerse.text.split(" "); const candidates=words.map((_,i)=>i).filter(i=>words[i].replace(/[^a-zA-Z]/g,"").length>2); const shuffled=[...candidates].sort(()=>Math.random()-0.5); return shuffled.slice(0,Math.min(memTargetCount,candidates.length)).sort((a,b)=>a-b)},[memVerse,memDiff,memRound]);
  const memBank=useMemo(()=>{
    const correct=memHiddenIdx.map((wordIdx,pos)=>({id:`c${pos}`,word:memVerse.text.split(" ")[wordIdx],correctPos:pos,distractor:false}));
    const correctNorm=new Set(correct.map(c=>c.word.toLowerCase().replace(/[^a-z]/g,"")));
    const pool:string[]=[]; VERSES.forEach((v,vi)=>{if(vi===memIdx%VERSES.length) return; v.text.split(" ").forEach(w=>{const clean=w.replace(/[^a-zA-Z]/g,""); if(clean.length>=3&&clean.length<=12&&!correctNorm.has(w.toLowerCase().replace(/[^a-z]/g,""))&&!pool.includes(w)) pool.push(w)})});
    const shuffledPool=[...pool].sort(()=>Math.random()-0.5);
    const distCount=memDiff==="Easy"?4:memDiff==="Medium"?5:6;
    const distractors=shuffledPool.slice(0,distCount).map((word,i)=>({id:`d${i}`,word,correctPos:-1,distractor:true}));
    return [...correct,...distractors].sort(()=>Math.random()-0.5);
  },[memVerse,memHiddenIdx,memDiff,memShuffle,memRound]);
  useEffect(()=>{setMemFilled(Array(memHiddenIdx.length).fill(null));setMemBonusGiven(false);setMemRevealed(false);},[memHiddenIdx.length,memIdx,memDiff,memRound]);
  useEffect(()=>{if(!memStatsLoaded) return; const t=setTimeout(()=>{persist("bible_memorize",memStats).catch(()=>{})},700); return()=>clearTimeout(t)},[memStats,memStatsLoaded]);
  const memAccuracy=memStats.attempted>0?Math.round(memStats.correct/memStats.attempted*100):0;
  const memFilledCount=memFilled.filter(Boolean).length;
  const memIsPerfect=memFilledCount>0&&memFilledCount===memHiddenIdx.length&&memFilled.every((id,pos)=>{const item=memBank.find(b=>b.id===id); return item&&item.correctPos===pos});
  const tapWord=(id:string)=>{
    if(memRevealed) return;
    const item=memBank.find(b=>b.id===id); if(!item) return;
    if(memFilled.includes(id)) return;
    const emptyPos=memFilled.findIndex(x=>!x); if(emptyPos===-1) return;
    const next=[...memFilled]; next[emptyPos]=id; setMemFilled(next);
    const isCorrect=item.correctPos===emptyPos;
    setMemStats(prev=>({...prev,attempted:prev.attempted+1,correct:prev.correct+(isCorrect?1:0),points:Math.max(0,prev.points+(isCorrect?10:-5))}));
    if(!isCorrect) setMemResult(`Not quite — “${item.word}” doesn’t fit there. Tap the blank to take it back. −5 points.`);
    else setMemResult(`Nice! “${item.word}” fits. +10 points.`);
  };
  const clearBlank=(pos:number)=>{
    const id=memFilled[pos]; if(!id) return;
    const item=memBank.find(b=>b.id===id);
    const next=[...memFilled]; next[pos]=null; setMemFilled(next); setMemRevealed(false);
    if(item){const wasCorrect=item.correctPos===pos; setMemStats(prev=>({...prev,points:Math.max(0,prev.points+(wasCorrect?-10:5))}));}
    setMemResult("Blank cleared — the word is back in the bank. Try another.");
  };
  const recordMemDay=(prev:any)=>{const today=new Date().toISOString().slice(0,10); if(prev.lastDate===today) return prev; const y=new Date(); y.setDate(y.getDate()-1); const yesterday=y.toISOString().slice(0,10); const streak=prev.lastDate===yesterday?prev.streak+1:1; return {...prev,lastDate:today,streak,bestStreak:Math.max(prev.bestStreak,streak)};};
  const checkMem=()=>{
    if(memFilled.some(x=>!x)){setMemResult(`Fill every blank first — ${memFilledCount} of ${memHiddenIdx.length} filled. Tap a word chip to fill the next blank.`);return}
    const correctCount=memFilled.filter((id,pos)=>memBank.find(b=>b.id===id)?.correctPos===pos).length;
    let bonus=0; if(correctCount===memHiddenIdx.length&&!memBonusGiven&&!memRevealed){bonus=50; setMemBonusGiven(true); fireConfetti(); setMemResult(`Well done! Perfect round! All ${correctCount} words correct. +50 bonus!`);}
    else if(correctCount===memHiddenIdx.length){setMemResult(`Well done! All ${correctCount} words correct.`);}
    else {setMemResult(`${correctCount} of ${memHiddenIdx.length} correct. Tap any filled blank to clear it and try a different word. Wrong words are shown in red.`);}
    setMemStats(prev=>({...recordMemDay(prev),rounds:prev.rounds+1,points:prev.points+bonus}));
  };
  const nextMem=()=>{setMemIdx(i=>i+1);setMemRound(r=>r+1);setMemShuffle(s=>s+1);setMemFilled([]);setMemBonusGiven(false);setMemRevealed(false);setMemResult("New challenge! Tap the word chips to fill the blanks in order.")};
  const resetMem=()=>{setMemShuffle(s=>s+1);setMemFilled(Array(memHiddenIdx.length).fill(null));setMemBonusGiven(false);setMemRevealed(false);setMemResult("Blanks cleared and word bank reshuffled — same verse, fresh try.")};
  const revealMem=()=>{const correctIds=memHiddenIdx.map((_,pos)=>memBank.find(b=>b.correctPos===pos)?.id||null); setMemFilled(correctIds); setMemRevealed(true); setMemBonusGiven(true); setMemResult("Answer revealed — read it aloud twice, then tap Reset to try it yourself.");};
  const readMemInContext=()=>{const parsed=parseVerseRef(memVerse.ref); if(!parsed) return; setMoodOrigin({mood:"Memorize",ref:memVerse.ref,text:memVerse.text,book:parsed.book,chapter:parsed.chapter,verse:parsed.verse}); setCurrent({book:parsed.book,chapter:parsed.chapter}); setTab("random");};
  const readTodayInContext=()=>{const parsed=parseVerseRef(todayVerse.ref); if(!parsed) return; setMoodOrigin({mood:"Today's Word",ref:todayVerse.ref,text:todayVerse.text,book:parsed.book,chapter:parsed.chapter,verse:parsed.verse}); setCurrent({book:parsed.book,chapter:parsed.chapter}); setTab("random");};
  const tryAnotherVerse=()=>{setTab("verse"); window.scrollTo({top:0,behavior:"smooth"})};
  const backToToday=()=>{setMoodOrigin(null); setTab("today");};
  const backToMemorize=()=>{setMoodOrigin(null); setTab("memorize");};
  const moodPool=MOOD_POOLS[moodSel.name]||moodSel.verses;
  const moodVerses=moodSlots.map(i=>moodPool[i%moodPool.length]);
  const selectMood=(m:typeof MOODS[number])=>{setMoodSel(m);setMoodSlots([0,1,2]);setMoodAnimKeys([0,0,0]);};
  const nextPromise=(slot:number)=>{setMoodSlots(prev=>{const next=[...prev];next[slot]=(next[slot]+1)%Math.max(1,moodPool.length);return next});setMoodAnimKeys(prev=>{const next=[...prev];next[slot]=next[slot]+1;return next});};
  const readInContext=(v:Verse)=>{const parsed=parseVerseRef(v.ref);if(!parsed) return;setMoodOrigin({mood:moodSel.name,ref:v.ref,text:v.text,book:parsed.book,chapter:parsed.chapter,verse:parsed.verse});setCurrent({book:parsed.book,chapter:parsed.chapter});setTab("random");};
  const backToMood=()=>{const m=MOODS.find(x=>x.name===(moodOrigin?.mood||moodSel.name))||moodSel;setMoodSel(m);setMoodSlots([0,1,2]);setMoodOrigin(null);setTab("mood");};
  const versePool=topicSel==="All Topics"?VERSES:(TOPIC_VERSES[topicSel]||VERSES);
  const displayedVerse=versePool[verseIdx%versePool.length]||VERSES[0];
  const showVerse=(i:number)=>{if(i===verseIdx) return; setVerseIdx(i); setVerseHistory(prev=>[...prev,i].slice(-20)); setVerseSeen(s=>s+1); setVerseAnimKey(k=>k+1);};
  const nextPromiseVerse=()=>{if(versePool.length<=1) return; let n=verseIdx; while(n===verseIdx){n=Math.floor(Math.random()*versePool.length);} showVerse(n);};
  const selectTopic=(name:string)=>{setTopicSel(name); setVerseIdx(0); setVerseHistory([0]); setVerseSeen(s=>s+1); setVerseAnimKey(k=>k+1); setTab("verse"); window.scrollTo({top:0,behavior:"smooth"});};
  const clearTopic=()=>{setTopicSel("All Topics"); setVerseIdx(0); setVerseHistory([0]); setVerseAnimKey(k=>k+1);};
  const surpriseTopic=()=>{const pick=TOPIC_META[Math.floor(Math.random()*TOPIC_META.length)]; setTopicSel(pick.name); const pool=TOPIC_VERSES[pick.name]||VERSES; setVerseIdx(Math.floor(Math.random()*pool.length)); setVerseHistory([0]); setVerseAnimKey(k=>k+1); setTab("verse"); window.scrollTo({top:0,behavior:"smooth"}); showToast(`Surprise! Topic: ${pick.name} ${pick.emoji}`);};
  const readVerseInContext=()=>{const v=displayedVerse; const parsed=parseVerseRef(v.ref); if(!parsed) return; setMoodOrigin({mood:"Random Verse",ref:v.ref,text:v.text,book:parsed.book,chapter:parsed.chapter,verse:parsed.verse}); setCurrent({book:parsed.book,chapter:parsed.chapter}); setTab("random");};
  const backToVerse=()=>{const origin=moodOrigin; setMoodOrigin(null); setTab("verse"); if(origin){const pool=topicSel==="All Topics"?VERSES:(TOPIC_VERSES[topicSel]||VERSES); const i=pool.findIndex(x=>x.ref===origin.ref); if(i>=0&&i!==verseIdx){setVerseIdx(i); setVerseAnimKey(k=>k+1);}}};
  useEffect(()=>{
    if(tab!=="random"||!moodOrigin) return undefined;
    const t=setTimeout(()=>{document.getElementById("mood-target-verse")?.scrollIntoView({behavior:"smooth",block:"center"})},450);
    return()=>clearTimeout(t);
  },[tab,moodOrigin,current.book,current.chapter]);

  const filteredBooks=BOOKS.filter(b=>testament==="All"||b.test===testament);
  const countForBook=(b:{name:string;chapters:number})=>readChapters.filter(r=>r.startsWith(b.name+" ")).length;
  const booksReadCount=BOOKS.filter(b=>countForBook(b)===b.chapters).length;
  const booksStartedCount=BOOKS.filter(b=>{const c=countForBook(b); return c>0&&c<b.chapters;}).length;
  const progressPct=readChapters.length?Math.round(readChapters.length/1189*100):0;
  const todayStr=new Date().toDateString();
  const yesterdayStr=new Date(Date.now()-86400000).toDateString();
  const todayCount=readHistory.filter(h=>new Date(h.ts).toDateString()===todayStr).length;
  const weekCount=readHistory.filter(h=>h.ts>=Date.now()-7*86400000).length;
  const minutesRead=readChapters.length*3;
  const lastHistory=readHistory[readHistory.length-1];
  const lastKey=lastHistory?.key||null;
  const suggestedNextKey=(()=>{ if(lastKey){const p=parseChapterKey(lastKey); if(p){const b=BOOKS.find(x=>x.name===p.book); if(b){for(let i=p.chapter+1;i<=b.chapters;i++){const k=`${b.name} ${i}`; if(!readChapters.includes(k)) return k;}}}} for(const b of BOOKS){for(let i=1;i<=b.chapters;i++){const k=`${b.name} ${i}`; if(!readChapters.includes(k)) return k;}} return null; })();
  const weeklyData=(()=>{ const d=new Date(); const offset=(d.getDay()+6)%7; const mon=new Date(d); mon.setDate(d.getDate()-offset); mon.setHours(0,0,0,0); return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label,i)=>{const day=new Date(mon); day.setDate(mon.getDate()+i); const count=readHistory.filter(h=>new Date(h.ts).toDateString()===day.toDateString()).length; return {label,count,isToday:day.toDateString()===todayStr};}); })();
  const favAllVerses: Verse[] = [...manualFavs, ...saved].filter((v,idx,arr)=>arr.findIndex(x=>x.ref===v.ref)===idx);
  const favSorted=[...favAllVerses].sort((a,b)=>(favRefs.includes(b.ref)?1:0)-(favRefs.includes(a.ref)?1:0));
  const favBg=(ref:string)=> favColors[ref]==="rose"?"#ffe0e8":favColors[ref]==="sky"?"#dbeeff":favColors[ref]==="gold"?"#fff3c4":"var(--surface)";
  const historySorted=[...readHistory].sort((a,b)=>b.ts-a.ts).slice(0,20);
  const historyGroups:{label:string;items:{key:string;ts:number}[]}[]=[{label:"Today",items:historySorted.filter(h=>new Date(h.ts).toDateString()===todayStr)},{label:"Yesterday",items:historySorted.filter(h=>new Date(h.ts).toDateString()===yesterdayStr)},{label:"Earlier",items:historySorted.filter(h=>new Date(h.ts).toDateString()!==todayStr&&new Date(h.ts).toDateString()!==yesterdayStr)}];
  const formatHistoryTime=(ts:number)=>{ const d=new Date(ts); if(d.toDateString()===todayStr) return `Today, ${d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`; if(d.toDateString()===yesterdayStr) return `Yesterday, ${d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`; return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})+`, ${d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`; };
  const trackerBooksFiltered=(()=>{ let list=BOOKS.filter(b=>{ if(trackerFilter==="Old"&&b.test!=="Old") return false; if(trackerFilter==="New"&&b.test!=="New") return false; const c=countForBook(b); if(trackerFilter==="Started"&&!(c>0&&c<b.chapters)) return false; if(trackerFilter==="Completed"&&c!==b.chapters) return false; if(trackerFilter==="Not Started"&&c!==0) return false; if(bookSearch.trim()&&!b.name.toLowerCase().includes(bookSearch.trim().toLowerCase())) return false; return true; }); if(trackerSort==="A-Z") list=[...list].sort((a,b)=>a.name.localeCompare(b.name)); if(trackerSort==="Progress") list=[...list].sort((a,b)=>(countForBook(b)/b.chapters)-(countForBook(a)/a.chapters)); return list; })();
  const trackerSummary=`Bible Reading Summary\nBooks Read: ${booksReadCount} / 66 • Books Started: ${booksStartedCount}\nChapters Read: ${readChapters.length} / 1,189 • Progress: ${progressPct}%\nVerses Saved: ${saved.length} • Favorite Verses: ${favRefs.length}\nCurrent Streak: ${streak} days • Total Points: ${memStats.points}\nEstimated Minutes Read: ${minutesRead}\nToday: ${todayCount} chapters • This Week: ${weekCount} chapters\nDaily Goal: ${dailyGoal} chapters / day\nLast Read: ${lastKey||"—"}\nSuggested Next: ${suggestedNextKey||"All chapters read!"}`;

  return (
  <div data-safe-area-inset-root data-theme={theme} className={`min-h-screen paper ${sans?"font-sans-mode":""}`} style={{boxSizing:"border-box",paddingTop:"var(--safe-area-inset-top)",background:"var(--bg)",color:"var(--ink)"}}>
    {confetti.map(i=><span key={i} className="confetti" style={{left:`${(i*23)%100}%`,background:["#e7c65a","#b58a2e","#7fb069","#6aa8ff","#ff8fa3"][i%5],animationDelay:`${(i%10)*0.12}s`}}/>)}
    {/* Header */}
    <header data-safe-area-sticky-top className="sticky z-40 border-b" style={{top:"var(--safe-area-inset-top)",background:"var(--surface)",borderColor:"var(--line)"}}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 flex-wrap">
        <button onClick={()=>setTab("random")} className="flex items-center gap-2 min-w-0"><span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{background:"var(--navy)"}}><ProperCross size={21}/></span><span className="text-left leading-none"><span className="block font-black text-[19px] sm:text-[22px] tracking-tight">Bible Randomizer</span><span className="hidden sm:block text-[11px] tracking-[.18em] uppercase opacity-60">Discover New Verses With Every Spin.</span></span></button>
        <nav className="flex gap-1 ml-auto overflow-x-auto scroll-thin max-w-full">
          {(["random","verse","today","mood","memorize","topics","saved","how"] as Tab[]).map(t=><button key={t} onClick={()=>setTab(t)} className={`chip whitespace-nowrap capitalize ${tab===t?"active":""}`}>{t==="random"?"Random":t==="verse"?"Verse":t==="today"?"Today":t==="mood"?"Mood":t==="memorize"?"Memorize":t==="topics"?"Topics":t==="saved"?"Tracker":"How It Works"}</button>)}
        </nav>
        <div className="flex items-center gap-1.5">
          <button title="Theme" onClick={()=>setTheme(theme==="light"?"sepia":theme==="sepia"?"dark":"light")} className="w-9 h-9 rounded-full grid place-items-center border" style={{borderColor:"var(--line)",background:"var(--surface2)"}}>{theme==="light"?<Sun size={17}/>:theme==="sepia"?<BookOpen size={17}/>:<Moon size={17}/>}</button>
          <button title="Font" onClick={()=>setSans(!sans)} className="h-9 px-3 rounded-full border text-[13px] font-bold" style={{borderColor:"var(--line)",background:"var(--surface2)"}}>{sans?"Sans":"Serif"}</button>
        </div>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 overflow-x-clip">
      {/* Hero */}
      {!isInfoPage && (<>
      <section className="pt-7 sm:pt-10 pb-6 grid md:grid-cols-[1.25fr_.75fr] gap-5 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{borderColor:"var(--line)",background:"var(--surface)"}}><Sparkles size={14} style={{color:"var(--gold)"}}/> 1,189 chapters • 66 books • One fresh word at a time</div>
          <h1 className="serif font-black leading-[.95] mt-4" style={{fontSize:"clamp(38px,7vw,72px)"}}>Discover New Verses <span style={{color:"var(--gold)"}}>With Every Spin.</span></h1>
          <p className="mt-4 text-[16px] sm:text-[18px] leading-relaxed opacity-80 max-w-[560px]">Bible Randomizer makes exploring God's Word an exciting experience. Instead of always following the same reading routine, let a random Bible verse or chapter introduce you to passages you might otherwise miss. Generate random verses, explore different books of the Bible, and discover meaningful Scripture to reflect on each day.</p>
          <div className="flex flex-wrap gap-3 mt-6 items-center">
            <button onClick={()=>spin()} className={`btn px-7 py-4 text-white text-[17px] flex items-center gap-2 shadow-lg ${spinning?"dice-anim":""}`} style={{background:"var(--navy)"}}><Dices size={22}/> {spinning?"Spinning…":"SPIN — Random Chapter"}</button>
            <button onClick={()=>{setTab("today");window.scrollTo({top:0,behavior:"smooth"})}} className="btn px-5 py-4 border font-bold" style={{borderColor:"var(--line)",background:"var(--surface)"}}>Today’s Word →</button>
            <span className="text-[13px] opacity-60">Press <kbd className="px-2 py-0.5 rounded border bg-white/60 font-bold">Space</kbd> to spin</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <span className="chip !cursor-default flex items-center gap-1.5"><Flame size={14} style={{color:"var(--gold)"}}/> {streak}-day streak</span>
            <span className="chip !cursor-default flex items-center gap-1.5"><BookOpen size={14}/> {readChapters.length} / 1,189 chapters</span>
            <span className="chip !cursor-default flex items-center gap-1.5"><Heart size={14}/> {saved.length} saved verses</span>
            <span className="chip !cursor-default flex items-center gap-1.5"><Trophy size={14}/> Favorite: {favBook}</span>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 float" style={{background:"var(--gold)"}}/>
          <p className="text-[11px] tracking-[.2em] uppercase font-bold opacity-60">Today • {new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</p>
          <p className="serif text-[22px] leading-snug mt-3">“{todayVerse.text}”</p>
          <p className="mt-3 font-bold" style={{color:"var(--gold)"}}>— {todayVerse.ref} <span className="ml-2 text-[12px] px-2 py-1 rounded-full border" style={{borderColor:"var(--line)"}}>{todayVerse.cat}</span></p>
          <div className="flex gap-2 mt-4 flex-wrap"><button onClick={()=>{saveVerse(todayVerse)}} className="btn px-4 py-2.5 text-white text-sm flex gap-1.5 items-center" style={{background:"var(--gold)"}}><Heart size={15}/> Save verse</button><button onClick={()=>{setTab("today")}} className="btn px-4 py-2.5 border text-sm">Open Today’s Word</button></div>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="card p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex-1 flex gap-2 min-w-0">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search — try “John 3” or “Psalm 23”" className="w-full h-11 pl-10 pr-3 rounded-full border bg-transparent text-[15px]" style={{borderColor:"var(--line)"}}/></div>
          <button onClick={doSearch} className="btn px-5 h-11 text-white shrink-0" style={{background:"var(--navy)"}}>Go</button>
        </div>
        <div className="flex gap-1.5 flex-wrap"><span className="text-[13px] font-bold self-center mr-1">Testament:</span>{(["All","Old","New"] as const).map(t=><button key={t} onClick={()=>setTestament(t)} className={`chip ${testament===t?"active":""}`}>{t==="All"?"All":t==="Old"?"Old Testament":"New Testament"}</button>)}</div>
        <label className="flex items-center gap-2 text-[13px] font-bold">Book<select value={current.book} onChange={e=>{setCurrent({book:e.target.value,chapter:1});setTab("random")}} className="h-10 rounded-full border px-3 bg-transparent max-w-[160px]" style={{borderColor:"var(--line)"}}>{BOOKS.map(b=><option key={b.name} value={b.name}>{b.name} ({b.chapters})</option>)}</select></label>
      </section>
      </>)}
      {!isInfoPage && searchMsg&&<p className="mt-2 text-[13px] font-semibold px-1">{searchMsg}</p>}
      {saveError&&<p className="mt-2 text-[13px] font-semibold text-red-600 px-1">{saveError} {saving?"Saving…":""}</p>}

      {/* TABS */}
      {tab==="random"&&(
      <section ref={readerRef} className="mt-6 grid lg:grid-cols-[300px_1fr] gap-5 items-start">
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between"><span className="text-[11px] tracking-[.18em] uppercase font-bold opacity-60">Now reading</span><span className="text-[11px] px-2 py-1 rounded-full font-bold" style={{background:"var(--surface2)"}}>{bookInfo.test} Testament</span></div>
            <h2 className="serif text-[34px] font-black leading-none mt-2">{current.book} <span style={{color:"var(--gold)"}}>{current.chapter}</span></h2>
            <p className="text-[14px] mt-2 opacity-75">{bookInfo.about}</p>
            <dl className="grid grid-cols-2 gap-2 mt-4 text-[13px]"><div className="p-3 rounded-xl" style={{background:"var(--surface2)"}}><dt className="opacity-60">Author</dt><dd className="font-bold">{bookInfo.author}</dd></div><div className="p-3 rounded-xl" style={{background:"var(--surface2)"}}><dt className="opacity-60">Chapters</dt><dd className="font-bold">{bookInfo.chapters}</dd></div></dl>
            <button onClick={()=>spin()} className={`btn w-full mt-4 py-3.5 text-white flex justify-center gap-2 ${spinning?"dice-anim":""}`} style={{background:"var(--gold)"}}><Shuffle size={18}/> Spin again</button>
            <div className="mt-4"><div className="flex justify-between text-[12px] font-bold"><span>Your progress</span><span>{readChapters.length} / 1189</span></div><div className="h-2.5 rounded-full mt-1 overflow-hidden" style={{background:"var(--surface2)"}}><div className="h-full rounded-full transition-all" style={{width:`${Math.max(2,readChapters.length/1189*100)}%`,background:"var(--gold)"}}/></div><p className="text-[12px] mt-1 opacity-60">{(readChapters.length/1189*100).toFixed(2)}% of the Bible explored</p></div>
          </div>
          <div className="card p-5"><h3 className="font-black flex gap-2 items-center"><Target size={17} style={{color:"var(--gold)"}}/> 7-Day Reading Plan</h3><div className="mt-3 space-y-2">{PLAN.map(p=><button key={p.day} onClick={()=>{const [b,c]=p.ref.split(/ (?=\d+$)/); setCurrent({book:b,chapter:Number(c)}); window.scrollTo({top:0,behavior:"smooth"})}} className="w-full text-left p-3 rounded-xl border flex gap-3 items-center" style={{borderColor:planDone.includes(p.day)?"var(--gold)":"var(--line)",background:planDone.includes(p.day)?"var(--surface2)":"var(--surface)"}}><span className="w-8 h-8 rounded-full grid place-items-center font-black text-sm shrink-0" style={{background:planDone.includes(p.day)?"var(--gold)":"var(--surface2)",color:planDone.includes(p.day)?"white":"inherit"}}>{planDone.includes(p.day)?<Check size={16}/>:p.day}</span><span className="min-w-0"><span className="block font-bold text-[14px] truncate">{p.title} — {p.ref}</span><span className="block text-[12px] opacity-60 truncate">{p.note}</span></span></button>)}</div><button onClick={async()=>{const next=planDone.includes(1)?[]:PLAN.map(p=>p.day); setPlanDone(next); await persist("bible_plan",{done:next}); showToast(next.length?"Plan marked complete 🎉":"Plan reset")}} className="btn w-full mt-3 py-2.5 border text-sm">{planDone.length===7?"Reset plan":"Mark all done"}</button></div>
        </aside>

        <article className="card p-5 sm:p-7">
          {moodOrigin&&moodTargetVerse!==null&&<div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 rounded-xl border-2" style={{borderColor:"var(--gold)",background:"rgba(231,198,90,.18)"}}><p className="text-[14px] font-bold">You came from {moodOrigin.mood} - {moodOrigin.ref}</p><button onClick={moodOrigin.mood==="Random Verse"?backToVerse:moodOrigin.mood==="Today's Word"?backToToday:moodOrigin.mood==="Memorize"?backToMemorize:backToMood} className="btn px-4 py-2 border text-sm font-bold" style={{borderColor:"var(--line)",background:"var(--surface)"}}>{moodOrigin.mood==="Random Verse"?"← Back to Verse":moodOrigin.mood==="Today's Word"?"← Back to Today's Word":moodOrigin.mood==="Memorize"?"← Back to Memorize":"← Back to Mood"}</button></div>}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div><p className="text-[11px] tracking-[.2em] uppercase font-bold opacity-60">Chapter • {isFull?"Full text":"Opening excerpt"}</p><h3 className="serif text-[26px] sm:text-[32px] font-black">{current.book} {current.chapter}</h3></div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button onClick={()=>setFontSize(s=>Math.max(14,s-2))} className="btn px-3 py-2 border font-black">A-</button><span className="text-[13px] font-bold w-10 text-center">{fontSize}px</span><button onClick={()=>setFontSize(s=>Math.min(28,s+2))} className="btn px-3 py-2 border font-black">A+</button>
              <button onClick={()=>speak(chapterText.join(" "))} className="btn px-3 py-2 border flex gap-1.5 items-center text-[13px]"><Volume2 size={15}/> Speak</button>
              <button onClick={toggleBookmark} className="btn px-3 py-2 border flex gap-1.5 items-center text-[13px]" style={{background:bookmarks.includes(chapterKey)?"var(--gold)":"transparent",color:bookmarks.includes(chapterKey)?"white":"inherit"}}><Bookmark size={15} fill={bookmarks.includes(chapterKey)?"currentColor":"none"}/> {bookmarks.includes(chapterKey)?"Saved":"Bookmark"}</button>
              {readChapters.includes(chapterKey)?<button onClick={()=>unmarkChapterKey(chapterKey)} className="btn px-3 py-2 border flex gap-1.5 items-center text-[13px] font-bold" style={{background:"var(--gold)",color:"white"}}><Check size={15}/> Read ✓ • Mark as Unread</button>:<button onClick={()=>markChapterKey(chapterKey)} className="btn px-3 py-2 border flex gap-1.5 items-center text-[13px] font-bold"><Check size={15}/> Mark Chapter as Read</button>}
            </div>
          </div>
          {!isFull&&<p className="mt-3 text-[13px] p-3 rounded-xl" style={{background:"var(--surface2)"}}>This chapter shows a 5-verse opening excerpt to get you started. The chapters in the spin pool with full text include Genesis 1, Psalm 1, Psalm 23, Proverbs 3, Isaiah 40, Jeremiah 29, Matthew 5, John 3, Romans 8 &amp; 12, 1 Corinthians 13, Philippians 4, and Psalms 19, 46, 100 &amp; 121.</p>}
          {!isFull&&moodOrigin&&moodTargetVerse!==null&&<div id="mood-target-verse" className="mt-4 p-5 rounded-2xl target-verse"><p className="text-[11px] tracking-[.18em] uppercase font-bold" style={{color:"var(--gold)"}}>Your verse in context • {moodOrigin.ref}</p><p className="serif text-[20px] leading-relaxed mt-2">“{moodOrigin.text}”</p><p className="font-bold mt-2" style={{color:"var(--gold)"}}>— {moodOrigin.ref}</p><p className="text-[13px] mt-2 opacity-75">The full text of this chapter is not in the dataset yet, so the verse you came from is shown prominently above with the opening excerpt below.</p></div>}
          <div className="mt-5 space-y-4" style={{fontSize}}>
            {chapterText.map((v,i)=>{const ref=`${chapterKey}:${i+1}`; const hl=highlights.find(h=>h.ref===ref); return (
            <div key={i} className="group relative" id={moodTargetVerse===i+1?"mood-target-verse":undefined}>
              <p className={`serif leading-[1.75] p-2 rounded-xl transition ${moodTargetVerse===i+1?"target-verse":""}`} style={{background:moodTargetVerse===i+1?undefined:hl?COLORS.find(c=>c.n===hl.color)?.c:undefined}}><span className="verse-num">{i+1}</span>{v}{moodTargetVerse===i+1&&<span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:"var(--gold)",color:"white"}}>Your verse</span>}</p>
              <div className="flex gap-1.5 mt-1 flex-wrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={()=>setHighlightPick(highlightPick===ref?null:ref)} className="chip !py-1 !px-2 !text-[12px] flex gap-1 items-center"><Highlighter size={12}/> Highlight</button>
                <button onClick={()=>{copyText(`${v} — ${ref}`);showToast("Verse copied")}} className="chip !py-1 !px-2 !text-[12px] flex gap-1 items-center"><Copy size={12}/> Copy</button>
                <button onClick={()=>{setShowNote(ref);setNoteText(notes.find(n=>n.ref===ref)?.text||"")}} className="chip !py-1 !px-2 !text-[12px] flex gap-1 items-center"><NotebookPen size={12}/> Note</button>
                <button onClick={()=>saveVerse({text:v,ref,cat:bookInfo.test})} className="chip !py-1 !px-2 !text-[12px] flex gap-1 items-center"><Heart size={12}/> Save</button>
              </div>
              {highlightPick===ref&&<div className="flex gap-2 mt-2 items-center"><span className="text-[12px] font-bold">Choose color:</span>{COLORS.map(c=><button key={c.n} onClick={()=>setHighlight(ref,c.n)} className="w-7 h-7 rounded-full border-2" style={{background:c.c,borderColor:"var(--ink)"}} aria-label={c.n}/>)}<button onClick={()=>setHighlightPick(null)} className="chip !py-1 !px-2"><X size={13}/></button></div>}
              {showNote===ref&&<div className="mt-2 flex gap-2"><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="What stood out in this verse?" className="flex-1 min-h-[64px] rounded-xl border p-3 bg-transparent text-[14px]" style={{borderColor:"var(--line)"}}/><button onClick={addNote} className="btn px-4 text-white self-start py-2.5 text-sm" style={{background:"var(--navy)"}}>Save note</button></div>}
            </div>)})}
          </div>
          <div className="flex flex-wrap gap-2 mt-7 pt-5 border-t" style={{borderColor:"var(--line)"}}><button onClick={markRead} className="btn px-5 py-3 text-white flex gap-2 items-center" style={{background:"var(--navy)"}}><Check size={17}/> Mark chapter as read</button><button onClick={()=>spin()} className="btn px-5 py-3 border flex gap-2 items-center"><Dices size={17}/> Next random chapter</button><button onClick={()=>{const prev=Math.max(1,current.chapter-1);setCurrent({...current,chapter:prev})}} className="btn px-4 py-3 border">← Prev</button><button onClick={()=>{const next=Math.min(bookInfo.chapters,current.chapter+1);setCurrent({...current,chapter:next})}} className="btn px-4 py-3 border">Next →</button></div>
        </article>
      </section>
      )}

      {tab==="verse"&&(
      <section className="mt-6">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap"><h2 className="font-black text-[16px]">Browse by Topic</h2><button onClick={()=>setTab("topics")} className="text-[13px] font-bold underline" style={{color:"var(--gold)"}}>View all topics →</button></div>
          <div className="flex gap-2 mt-3 overflow-x-auto scroll-thin pb-1 -mx-1 px-1" role="tablist" aria-label="Topics">
            <button onClick={clearTopic} className={`chip whitespace-nowrap ${topicSel==="All Topics"?"active":""}`}>🌍 All Topics • {VERSES.length} verses</button>
            {TOPIC_META.map(m=><button key={m.name} onClick={()=>selectTopic(m.name)} className={`chip whitespace-nowrap ${topicSel===m.name?"active":""}`}>{m.emoji} {m.name} • {(TOPIC_VERSES[m.name]||[]).length} verses</button>)}
            <button onClick={surpriseTopic} className="chip whitespace-nowrap font-bold" style={{background:"var(--gold)",color:"white",borderColor:"var(--gold)"}}>🎲 Surprise Me</button>
          </div>
          <p className="text-[12px] opacity-60 mt-2">Pick a topic to filter Random Verse. “Next Promise” will only pick from that topic.</p>
        </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start mt-4">
        <div className="space-y-4 min-w-0">
        <div className="card p-6 sm:p-9 text-center relative overflow-hidden pop" key={`${verseIdx}-${verseAnimKey}`}>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{background:"var(--gold)"}}/>
          <span className="inline-block px-3 py-1 rounded-full text-[12px] font-bold" style={{background:"var(--surface2)"}}>{displayedVerse.cat} • Verse {verseIdx+1} of {versePool.length}</span>{topicSel!=="All Topics"&&<span className="inline-flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full text-[12px] font-bold text-white" style={{background:"var(--gold)"}}>Showing: {topicSel} <button onClick={clearTopic} aria-label="Clear topic" className="font-black">✕ Clear topic</button></span>}
          <div key={verseAnimKey} className="mood-verse-anim">
          <p className="serif leading-[1.35] mt-6 mx-auto max-w-[720px]" style={{fontSize:"clamp(28px,4.5vw,46px)"}}>“{displayedVerse.text}”</p>
          <p className="mt-5 font-black text-[20px]" style={{color:"var(--gold)"}}>— {displayedVerse.ref}</p>
          <p className="mt-3 text-[13px] font-bold opacity-70">Verse {verseSeen} seen • {displayedVerse.cat}{topicSel!=="All Topics"?` • Topic: ${topicSel}`:""}</p>
          </div>
          <div className="flex justify-center gap-2 mt-7 flex-wrap">
            <button onClick={()=>{copyText(`${displayedVerse.text} — ${displayedVerse.ref}`);showToast("Verse copied")}} className="btn px-4 py-3 border flex gap-1.5 items-center text-sm"><Copy size={16}/> Copy</button>
            <button onClick={()=>speak(displayedVerse.text)} className="btn px-4 py-3 border flex gap-1.5 items-center text-sm"><Mic size={16}/> Speak</button>
            <button onClick={()=>saveVerse(displayedVerse)} className="btn px-4 py-3 text-white flex gap-1.5 items-center text-sm" style={{background:"var(--gold)"}}><Heart size={16}/> Save</button>
            <button onClick={nextPromiseVerse} className="btn px-5 py-3 text-white flex gap-1.5 items-center text-sm" style={{background:"var(--gold)"}}><RefreshCw size={16}/> Next Promise ↻</button>
            <button onClick={readVerseInContext} className="btn px-5 py-3 border flex gap-1.5 items-center text-sm font-bold" style={{borderColor:"var(--line)",background:"var(--surface)"}}><BookOpen size={16}/> Read in Context</button>
          </div>
          <p className="text-[13px] opacity-60 mt-5">Tip: press <b>Space</b> anywhere to spin a new chapter.</p>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2"><h3 className="font-black text-[15px]">Recent Promises</h3><span className="text-[12px] font-bold opacity-60">{verseSeen} seen</span></div>
          <p className="text-[12px] opacity-60 mt-1">Tap a recent verse to return to it.</p>
          <div className="flex gap-2 mt-3 overflow-x-auto scroll-thin pb-1 -mx-1 px-1">
            {verseHistory.slice(-5).reverse().map((idx,i)=>{const v=versePool[idx%versePool.length]; if(!v) return null; const active=idx===verseIdx; return <button key={`${idx}-${i}`} onClick={()=>showVerse(idx)} className="text-left p-3 rounded-xl border shrink-0 w-[190px] sm:w-[210px]" style={{borderColor:active?"var(--gold)":"var(--line)",background:active?"rgba(231,198,90,.18)":"var(--surface)",outline:active?"2px solid var(--gold)":"none"}}><span className="block text-[12px] font-bold" style={{color:"var(--gold)"}}>{v.ref}{active?" • Now":""}</span><span className="block text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block" style={{background:"var(--surface2)"}}>{topicSel!=="All Topics"?`Topic: ${topicSel}`:v.cat}</span><span className="block text-[12px] leading-snug mt-1 line-clamp-2 opacity-80">“{v.text}”</span></button>})}
          </div>
        </div>
        </div>
        <aside className="card p-5"><h3 className="font-black">Browse by category</h3><div className="flex flex-wrap gap-1.5 mt-3">{Array.from(new Set(VERSES.map(v=>v.cat))).map(c=><button key={c} onClick={()=>{setTopicSel("All Topics"); const i=VERSES.findIndex(v=>v.cat===c);showVerse(i)}} className="chip">{c}</button>)}</div><div className="mt-5 p-4 rounded-2xl" style={{background:"var(--surface2)"}}><p className="font-bold flex gap-2 items-center"><Zap size={16} style={{color:"var(--gold)"}}/> Why this works</p><p className="text-[13px] mt-1 opacity-75">One verse, fully read, beats ten skimmed. Save the ones that stop you — your library grows into a personal psalm book.</p></div></aside>
      </div>
      </section>
      )}

      {tab==="today"&&(
      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card p-6 sm:p-9">
          <div className="flex flex-wrap justify-between gap-3"><span className="px-3 py-1.5 rounded-full text-[12px] font-bold" style={{background:"var(--surface2)"}}>Same verse for everyone today</span><span className="font-bold text-[13px]">New word in <span style={{color:"var(--gold)"}}>{hh}:{mm}:{ss}</span></span></div>
          <p className="serif mt-6 leading-[1.35]" style={{fontSize:"clamp(30px,4.8vw,50px)"}}>“{todayVerse.text}”</p>
          <p className="mt-4 font-black text-[22px]" style={{color:"var(--gold)"}}>— {todayVerse.ref}</p>
          <p className="mt-3 opacity-75 max-w-[620px]">Carry this one line today. Read it once in the morning, once at noon, once before sleep — and notice what changes.</p>
          <div className="flex gap-2 mt-6 flex-wrap"><button onClick={readTodayInContext} className="btn px-5 py-3 text-white flex gap-2 items-center" style={{background:"var(--gold)"}}><BookOpen size={16}/> Read in Context</button><button onClick={()=>{copyText(`${todayVerse.text} — ${todayVerse.ref} | Today’s Word from Bible Randomizer`);showToast("Today’s Word copied — ready to share")}} className="btn px-5 py-3 text-white flex gap-2 items-center" style={{background:"var(--navy)"}}><Copy size={16}/> Copy</button><button onClick={()=>saveVerse(todayVerse)} className="btn px-5 py-3 border flex gap-2 items-center"><Heart size={16}/> Save</button><button onClick={()=>speak(todayVerse.text)} className="btn px-5 py-3 border flex gap-2 items-center"><Volume2 size={16}/> Speak</button><button onClick={tryAnotherVerse} className="btn px-5 py-3 border flex gap-2 items-center"><RefreshCw size={16}/> Try Another Verse</button></div>
          <p className="text-[13px] opacity-60 mt-3">Today’s Word never changes when you try another verse — it stays the same for everyone until midnight. “Try Another Verse” opens Random Verse mode instead.</p>
          <div className="grid sm:grid-cols-3 gap-2 mt-6">{[["Morning","Read it aloud"], ["Midday","Recall it once"], ["Evening","Write what it meant"]].map(([t,d])=><div key={t} className="p-4 rounded-2xl border" style={{borderColor:"var(--line)"}}><b>{t}</b><p className="text-[13px] opacity-70 mt-1">{d}</p></div>)}</div>
        </div>
        <aside className="card p-5"><h3 className="font-black flex gap-2 items-center"><History size={17}/> Verse of the Day history</h3><p className="text-[13px] opacity-70 mt-1">The last 7 days, chosen by the calendar — deterministic, so everyone shares the same word.</p><div className="mt-3 space-y-2">{Array.from({length:7},(_,i)=>{const v=VERSES[(dayOfYear()-i+VERSES.length)%VERSES.length]; const d=new Date(); d.setDate(d.getDate()-i); return <button key={i} onClick={()=>{setTopicSel("All Topics"); setVerseIdx(VERSES.findIndex(x=>x.ref===v.ref));setTab("verse")}} className="w-full text-left p-3 rounded-xl border" style={{borderColor:"var(--line)"}}><span className="text-[11px] font-bold opacity-60">{i===0?"TODAY":d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><span className="block text-[13px] leading-snug mt-1 line-clamp-2">“{v.text}”</span><span className="block text-[12px] font-bold mt-1" style={{color:"var(--gold)"}}>{v.ref}</span></button>})}</div></aside>
      </section>
      )}

      {tab==="mood"&&(
      <section className="mt-6">
        <div className="text-center max-w-[620px] mx-auto"><h2 className="serif text-[32px] sm:text-[40px] font-black">How are you arriving today?</h2><p className="opacity-75 mt-1">No fixing, no judgment. Pick the word that fits — we’ll meet you there.</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">{MOODS.map(m=><button key={m.name} onClick={()=>selectMood(m)} className="card p-4 text-left hover:-translate-y-0.5 transition" style={{outline:moodSel.name===m.name?"2px solid var(--gold)":"none"}}><span className="text-[28px]">{m.emoji}</span><span className="block font-black mt-2">{m.name}</span><span className="text-[12px] opacity-60">3 verses</span></button>)}</div>
        <div className="card p-6 sm:p-8 mt-5 pop" key={moodSel.name}><p className="text-[13px] font-bold tracking-[.16em] uppercase" style={{color:"var(--gold)"}}>For {moodSel.name.toLowerCase()}</p><p className="serif text-[22px] sm:text-[26px] leading-snug mt-2 max-w-[760px]">{moodSel.intro}</p><div className="grid md:grid-cols-3 gap-3 mt-5">{moodVerses.map((v,slot)=><article key={`${moodSel.name}-${slot}`} className="p-5 rounded-2xl border flex flex-col" style={{borderColor:"var(--line)",background:"var(--surface2)"}}><div key={moodAnimKeys[slot]} className="mood-verse-anim flex-1"><p className="serif text-[17px] leading-relaxed">“{v.text}”</p><p className="font-bold mt-3" style={{color:"var(--gold)"}}>{v.ref}</p><p className="text-[12px] font-bold mt-2 opacity-70">Promise {moodSlots[slot]%moodPool.length+1} of {moodPool.length}</p></div><div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>nextPromise(slot)} className="btn px-4 py-2.5 text-white text-sm flex gap-1.5 items-center flex-1 justify-center min-w-[140px]" style={{background:"var(--gold)"}}><RefreshCw size={15}/> Next Promise ↻</button><button onClick={()=>readInContext(v)} className="btn px-4 py-2.5 border text-sm flex gap-1.5 items-center flex-1 justify-center min-w-[140px] font-bold" style={{borderColor:"var(--line)",background:"var(--surface)"}}><BookOpen size={15}/> Read in Context</button></div><div className="flex flex-wrap gap-1.5 mt-2"><button onClick={()=>saveVerse(v)} className="chip !py-1.5 !text-[12px] flex gap-1 items-center"><Heart size={12}/> Save</button><button onClick={()=>{copyText(`${v.text} — ${v.ref}`);showToast("Copied")}} className="chip !py-1.5 !text-[12px] flex gap-1 items-center"><Copy size={12}/> Copy</button><button onClick={()=>speak(v.text)} className="chip !py-1.5 !text-[12px] flex gap-1 items-center"><Volume2 size={12}/> Speak</button></div></article>)}</div></div>
      </section>
      )}

      {tab==="memorize"&&(
      <section className="mt-6 grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap justify-between gap-3 items-center"><h2 className="serif text-[28px] font-black">Hide &amp; Seek — Memorize</h2><div className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-black" style={{background:"var(--gold)"}}><Star size={18} fill="currentColor"/> {memStats.points} points</div></div>
          <div className="flex flex-wrap gap-2 mt-3 text-[13px]"><span className="chip !cursor-default flex gap-1.5 items-center"><Flame size={14} style={{color:"var(--gold)"}}/> 🔥 {memStats.streak}-day streak • Best {memStats.bestStreak}</span><span className="chip !cursor-default">{memStats.rounds} rounds played</span><span className="chip !cursor-default">Accuracy {memAccuracy}%</span><span className="chip !cursor-default">{memStats.correct} correct words</span></div>
          <div className="flex flex-wrap gap-1.5 mt-4"><span className="text-[13px] font-bold self-center mr-1">Difficulty:</span>{(["Easy","Medium","Hard"] as const).map(d=><button key={d} onClick={()=>{setMemDiff(d); setMemResult(`${d} — hides ${d==="Easy"?3:d==="Medium"?6:10} words. Tap the chips to fill the blanks.`)}} className={`chip ${memDiff===d?"active":""}`}>{d} · {d==="Easy"?"hide 3":d==="Medium"?"hide 6":"hide 10"}</button>)}</div>
          <p className="text-[13px] opacity-70 mt-2">Tap a word chip to fill the next blank. Tap a filled blank to clear it. +10 per correct word, −5 per wrong word, +50 bonus for a perfect round. No typing needed.</p>
          <div className="mt-5"><div className="flex justify-between text-[12px] font-bold"><span>Blanks filled</span><span>{memFilledCount} / {memHiddenIdx.length}</span></div><div className="h-3 rounded-full mt-1 overflow-hidden" style={{background:"var(--surface2)"}}><div className="h-full rounded-full transition-all" style={{width:memHiddenIdx.length?`${memFilledCount/memHiddenIdx.length*100}%`:"0%",background:"var(--gold)"}}/></div></div>
          <div className="mt-6 p-6 rounded-2xl" style={{background:"var(--surface2)"}}><p className="text-[11px] tracking-[.18em] uppercase font-bold opacity-60">{memVerse.ref} • {memVerse.cat}</p><p className="serif text-[20px] sm:text-[26px] leading-[2] mt-3">{memVerse.text.split(" ").map((w,i)=>{const hiddenPos=memHiddenIdx.indexOf(i); if(hiddenPos===-1) return <span key={i}>{w} </span>; const filledId=memFilled[hiddenPos]; const filledWord=memBank.find(b=>b.id===filledId)?.word; const isWrong=!!filledId&&memBank.find(b=>b.id===filledId)?.correctPos!==hiddenPos; return <button key={i} onClick={()=>clearBlank(hiddenPos)} title={filledId?"Tap to clear this blank":"Empty blank"} className={`inline-flex items-center justify-center min-w-[72px] px-2 mx-1 rounded-lg border-2 align-middle text-[18px] sm:text-[22px] font-bold ${filledId?(isWrong?"mem-wrong":"mem-right"):"mem-blank"}`} style={{borderColor:filledId?(isWrong?"#d64545":"var(--gold)"):"var(--line)",background:filledId?(isWrong?"#ffe1e1":"#fff3c4"):"var(--surface)",color:filledId?(isWrong?"#b42323":"inherit"):"var(--muted)"}}>{filledWord||"______"}</button>})}</p></div>
          <p className="text-[13px] font-bold mt-5">Word bank — tap a word to fill the next blank:</p>
          <div className="flex flex-wrap gap-2 mt-2">{memBank.map(b=>{const used=memFilled.includes(b.id); return <button key={b.id} disabled={used||memRevealed} onClick={()=>tapWord(b.id)} className="chip !text-[15px] !px-4 !py-2.5 font-bold" style={{opacity:used?0.35:1,background:used?"var(--surface2)":"var(--surface)"}}>{b.word}{used?" ✓":""}</button>})}</div>
          {memResult&&<p className="mt-4 p-3 rounded-xl text-[14px] font-semibold" style={{background:memIsPerfect?"#e7f7e9":"var(--surface2)"}}>{memResult}</p>}
          {memIsPerfect&&<p className="mt-2 text-[16px] font-black" style={{color:"var(--gold)"}}>Well done! 🎉 Perfect round — +50 bonus when you tap Check Answer.</p>}
          <div className="flex gap-2 mt-4 flex-wrap"><button onClick={checkMem} className="btn px-5 py-3 text-white flex gap-2 items-center" style={{background:"var(--navy)"}}><Check size={16}/> Check Answer</button><button onClick={readMemInContext} className="btn px-5 py-3 border flex gap-2 items-center"><BookOpen size={16}/> Read in Context</button><button onClick={nextMem} className="btn px-5 py-3 border flex gap-2 items-center"><RefreshCw size={16}/> Try Next Challenge ↻</button><button onClick={resetMem} className="btn px-5 py-3 border">Reset</button><button onClick={revealMem} className="btn px-5 py-3 border">Reveal Answer</button></div>
          <p className="text-[13px] opacity-60 mt-4">Tip: read the full verse aloud twice, then hide it. Memory grows by trying, not by staring. Wrong words shake red — tap the blank to take one back.</p>
        </div>
        <aside className="card p-5"><h3 className="font-black flex gap-2 items-center"><Lightbulb size={17} style={{color:"var(--gold)"}}/> How to win</h3><ul className="text-[14px] space-y-2 mt-3 opacity-80"><li>• Easy hides 3 words — build confidence.</li><li>• Medium hides 6 — the sweet spot.</li><li>• Hard hides 10 — for verses you love.</li><li>• Say it aloud before you check.</li><li>• The bank includes 4–6 wrong words — read each blank in context.</li></ul><div className="mt-4 p-4 rounded-2xl" style={{background:"var(--surface2)"}}><b className="flex gap-1.5 items-center"><Star size={15} style={{color:"var(--gold)"}}/> Points &amp; streak</b><p className="text-[13px] mt-1 opacity-75">+10 correct • −5 wrong • +50 perfect round. Your points, streak, rounds and accuracy are saved and shown in Saved / Stats.</p><p className="text-[13px] mt-2 font-bold">🔥 {memStats.streak}-day streak • Best {memStats.bestStreak} • {memAccuracy}% accuracy</p></div><div className="mt-4 p-4 rounded-2xl" style={{background:"var(--surface2)"}}><b>Next up</b><p className="text-[13px] mt-1 opacity-75">“{VERSES[(memIdx+1)%VERSES.length].text.slice(0,80)}…”</p><p className="text-[12px] font-bold mt-1" style={{color:"var(--gold)"}}>{VERSES[(memIdx+1)%VERSES.length].ref}</p></div></aside>
      </section>
      )}

      {tab==="saved"&&(
      <section className="mt-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="serif text-[30px] sm:text-[36px] font-black leading-none">Reading Tracker</h2><p className="text-[14px] opacity-70 mt-1">Your whole journey — books, chapters, favorites and history — in one place.</p></div><div className="flex gap-2 flex-wrap"><button onClick={undoLastMark} className="btn px-4 py-2.5 border text-sm font-bold">↩ Undo last mark</button><button onClick={()=>setShowSummary(s=>!s)} className="btn px-4 py-2.5 border text-sm font-bold">Reading Summary</button><button onClick={()=>setShowResetConfirm(true)} className="btn px-4 py-2.5 border text-sm font-bold text-red-600">Reset Tracker</button></div></div>
        {showResetConfirm&&<div className="card p-5 border-2" style={{borderColor:"#d64545"}}><p className="font-black">Reset the tracker?</p><p className="text-[14px] opacity-75 mt-1">This clears chapters read, reading history and your streak. Saved verses, notes and highlights are kept.</p><div className="flex gap-2 mt-3"><button onClick={resetTrackerFn} className="btn px-5 py-2.5 text-white text-sm" style={{background:"#d64545"}}>Yes, reset tracker</button><button onClick={()=>setShowResetConfirm(false)} className="btn px-5 py-2.5 border text-sm">Keep my progress</button></div></div>}
        {showSummary&&<pre className="card p-5 text-[13px] leading-relaxed whitespace-pre-wrap">{trackerSummary}</pre>}
        <div className="card p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3 items-center"><div><p className="text-[11px] tracking-[.18em] uppercase font-bold opacity-60">Continue Reading</p><h3 className="serif text-[24px] font-black mt-1">{lastKey?`Last read: ${lastKey}`:"Start your first chapter"}</h3><p className="text-[14px] opacity-75 mt-1">Suggested next: <b>{suggestedNextKey||"Every chapter read — amazing!"}</b></p></div><div className="flex gap-2 flex-wrap">{lastKey&&<button onClick={()=>openChapterKey(lastKey)} className="btn px-5 py-3 text-white" style={{background:"var(--navy)"}}>Continue →</button>}{suggestedNextKey&&<button onClick={()=>openChapterKey(suggestedNextKey)} className="btn px-5 py-3 border font-bold">Suggested Next</button>}<button onClick={spinRandomUnread} className="btn px-5 py-3 text-white font-bold" style={{background:"var(--gold)"}}>🎲 Spin Random Unread</button></div></div></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Books Read</p><p className="text-[30px] font-black mt-1">{booksReadCount} / 66</p><p className="text-[12px] opacity-60 mt-1">Books Started: {booksStartedCount}</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Chapters Read</p><p className="text-[30px] font-black mt-1">{readChapters.length} / 1,189</p><p className="text-[12px] opacity-60 mt-1">Today: {todayCount} • This Week: {weekCount}</p></div>
          <div className="card p-5 col-span-2"><div className="flex justify-between items-baseline"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Progress</p><p className="text-[30px] font-black">{progressPct}%</p></div><div className="h-3 rounded-full mt-3 overflow-hidden" style={{background:"var(--surface2)"}}><div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.max(1,progressPct)}%`,background:"var(--gold)"}}/></div><p className="text-[12px] opacity-60 mt-2">{readChapters.length} of 1,189 chapters • {1189-readChapters.length} to go</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Verses Saved</p><p className="text-[30px] font-black mt-1">{saved.length}</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Favorite Verses</p><p className="text-[30px] font-black mt-1">{favRefs.length}</p><p className="text-[12px] opacity-60 mt-1">★ pinned at top below</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Current Streak</p><p className="text-[30px] font-black mt-1">{streak} days</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Total Points</p><p className="text-[30px] font-black mt-1">{memStats.points}</p><p className="text-[12px] opacity-60 mt-1">From Memorize</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Total Minutes Read</p><p className="text-[30px] font-black mt-1">{minutesRead}</p><p className="text-[12px] opacity-60 mt-1">≈ 3 min per chapter read</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Today</p><p className="text-[30px] font-black mt-1">{todayCount} chapters</p></div>
          <div className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">This Week</p><p className="text-[30px] font-black mt-1">{weekCount} chapters</p></div>
          <div className="card p-5 col-span-2"><div className="flex items-center gap-4"><div className="w-[86px] h-[86px] rounded-full grid place-items-center shrink-0 font-black text-[18px]" style={{background:`conic-gradient(var(--gold) ${Math.min(100,Math.round(todayCount/Math.max(1,dailyGoal)*100))*3.6}deg, var(--surface2) 0)`}}><span className="w-[64px] h-[64px] rounded-full grid place-items-center text-center text-[13px] leading-tight" style={{background:"var(--surface)"}}>{todayCount} / {dailyGoal}<br/>today</span></div><div className="flex-1"><p className="font-black">Daily Goal</p><p className="text-[13px] opacity-70 mt-1">How many chapters do you want to read today?</p><div className="flex gap-1.5 mt-2 flex-wrap">{[1,2,3,5].map(g=><button key={g} onClick={()=>changeGoal(g)} className={`chip ${dailyGoal===g?"active":""}`}>{g} / day</button>)}</div></div></div></div>
        </div>
        <div className="card p-5 sm:p-6"><div className="flex justify-between items-center flex-wrap gap-2"><h3 className="font-black text-[19px]">This Week — Chapters per Day</h3><span className="text-[12px] font-bold opacity-60">Mon–Sun • {weekCount} this week</span></div><div className="flex items-end gap-2 sm:gap-3 mt-4 h-[110px]">{weeklyData.map(d=>{const max=Math.max(1,...weeklyData.map(x=>x.count)); return <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1"><span className="text-[12px] font-bold">{d.count}</span><div className="w-full max-w-[44px] rounded-t-lg transition-all" style={{height:`${Math.max(6,d.count/max*84)}px`,background:d.isToday?"var(--gold)":"var(--surface2)",border:"1px solid var(--line)"}}/><span className="text-[11px] font-bold opacity-70">{d.label}</span></div>})}</div></div>
        <div className="card p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3 items-center"><h3 className="font-black text-[19px]">66-Book Grid — Tap a book to see its chapters</h3><span className="text-[12px] font-bold opacity-60">{trackerBooksFiltered.length} books shown</span></div><div className="flex flex-wrap gap-2 mt-4 items-center"><div className="relative flex-1 min-w-[180px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/><input value={bookSearch} onChange={e=>setBookSearch(e.target.value)} placeholder="Search books…" aria-label="Search books" className="w-full h-10 pl-9 pr-3 rounded-full border bg-transparent text-[14px]" style={{borderColor:"var(--line)"}}/></div>{(["All","Old","New","Started","Completed","Not Started"] as const).map(f=><button key={f} onClick={()=>setTrackerFilter(f)} className={`chip ${trackerFilter===f?"active":""}`}>{f}</button>)}<label className="text-[13px] font-bold flex items-center gap-2">Sort <select value={trackerSort} onChange={e=>setTrackerSort(e.target.value as any)} className="h-9 rounded-full border px-2 bg-transparent" style={{borderColor:"var(--line)"}}><option>Order</option><option>Progress</option><option>A-Z</option></select></label></div>
          {(["Old","New"] as const).map(test=>{const group=trackerBooksFiltered.filter(b=>b.test===test); if(!group.length) return null; return <div key={test} className="mt-5"><h4 className="font-black text-[16px]">{test==="Old"?"Old Testament (39 books)":"New Testament (27 books)"}</h4><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">{group.map(b=>{const c=countForBook(b); const pct=Math.round(c/b.chapters*100); const expanded=expandedBook===b.name; return <div key={b.name} className="p-3 rounded-xl border" style={{borderColor:expanded?"var(--gold)":"var(--line)",background:c===b.chapters?"rgba(231,198,90,.18)":"var(--surface)"}}><button onClick={()=>setExpandedBook(expanded?null:b.name)} className="w-full text-left"><span className="flex justify-between gap-2"><b className="text-[14px] leading-tight">{b.name}</b><span className="text-[12px] font-bold" style={{color:"var(--gold)"}}>{pct}%</span></span><span className="block text-[12px] opacity-70 mt-1">{c} / {b.chapters} chapters read {c===b.chapters?"✓ Complete":""}</span><span className="block h-1.5 rounded-full mt-2 overflow-hidden" style={{background:"var(--surface2)"}}><span className="block h-full" style={{width:`${pct}%`,background:c===b.chapters?"#2e9e5b":"var(--gold)"}}/></span><span className="block text-[12px] font-bold mt-2" style={{color:"var(--gold)"}}>{expanded?"Hide chapters ▲":"Show chapters ▼"}</span></button>{expanded&&<div className="mt-3"><div className="flex flex-wrap gap-1.5">{Array.from({length:b.chapters},(_,i)=>{const k=`${b.name} ${i+1}`; const isRead=readChapters.includes(k); return <button key={k} title={`${k} — ${isRead?"read, tap to mark unread":"unread, tap to mark read"}`} onClick={()=>toggleChapterKey(k)} className="w-9 h-9 rounded-lg text-[12px] font-black border-2" style={{background:isRead?"var(--gold)":"transparent",color:isRead?"white":"inherit",borderColor:isRead?"var(--gold)":"var(--line)"}}>{i+1}{isRead?" ✓":""}</button>})}</div><div className="flex gap-1.5 mt-3 flex-wrap"><button onClick={()=>openChapterKey(`${b.name} 1`)} className="chip !py-1.5 !text-[12px] font-bold">Open {b.name} 1 →</button><button onClick={()=>markAllInBook(b)} className="chip !py-1.5 !text-[12px] font-bold">Mark All in Book as Read</button></div><p className="text-[11px] opacity-60 mt-2">Tap a gold square to mark it unread. Tap a light square to mark it read. Gold = read.</p></div>}</div>})}</div></div>})}
        </div>
        <div className="card p-5 sm:p-6"><h3 className="font-black text-[19px]">My Favorite Verses</h3><p className="text-[13px] opacity-60 mt-1">★ favorites are pinned at top. Pick Gold, Rose or Sky to highlight a verse. Save any verse with ♥ to add it here.</p>
          <div className="mt-4 p-4 rounded-2xl border" style={{borderColor:"var(--line)",background:"var(--surface2)"}}><p className="font-black text-[14px]">Add a custom favorite verse</p><div className="grid sm:grid-cols-[180px_1fr] gap-2 mt-2"><input value={manualRef} onChange={e=>setManualRef(e.target.value)} placeholder="Reference — e.g. John 3:16" className="h-11 px-3 rounded-xl border bg-transparent text-[14px]" style={{borderColor:"var(--line)"}}/><input value={manualText} onChange={e=>setManualText(e.target.value)} placeholder="Verse text…" className="h-11 px-3 rounded-xl border bg-transparent text-[14px]" style={{borderColor:"var(--line)"}}/></div><div className="flex gap-2 mt-2 flex-wrap items-center"><span className="text-[12px] font-bold">Highlight:</span>{([{k:"gold",c:"#fff3c4",label:"Gold / Yellow"},{k:"rose",c:"#ffe0e8",label:"Rose / Pink"},{k:"sky",c:"#dbeeff",label:"Sky / Blue"}] as const).map(o=><button key={o.k} onClick={()=>setManualColor(o.k)} className="w-8 h-8 rounded-full border-2" style={{background:o.c,borderColor:manualColor===o.k?"var(--ink)":"var(--line)"}} aria-label={o.label} title={o.label}/>)}<button onClick={addManualFav} className="btn px-5 py-2.5 text-white text-sm ml-auto" style={{background:"var(--navy)"}}>Add Favorite Verse ★</button></div></div>
          {favSorted.length===0?<p className="text-[13px] opacity-60 mt-4">No favorite verses yet. Save a verse with ♥, or add one above.</p>:<div className="grid md:grid-cols-2 gap-3 mt-4">{favSorted.map(v=>{const isFav=favRefs.includes(v.ref); return <article key={v.ref} className="p-4 rounded-2xl border" style={{borderColor:isFav?"var(--gold)":"var(--line)",background:favBg(v.ref)}}><div className="flex justify-between gap-2"><b className="text-[14px]" style={{color:"var(--gold)"}}>{v.ref} {isFav?"★ Favorite":""}</b><button onClick={()=>toggleFavorite(v.ref)} className="text-[20px] leading-none" aria-label="Toggle favorite" title="Star / favorite toggle">{isFav?"★":"☆"}</button></div><p className="serif text-[16px] leading-relaxed mt-2">“{v.text}”</p><div className="flex items-center gap-2 mt-3"><span className="text-[12px] font-bold">Highlighter:</span>{([{k:"gold",c:"#fff3c4",label:"Gold / Yellow"},{k:"rose",c:"#ffe0e8",label:"Rose / Pink"},{k:"sky",c:"#dbeeff",label:"Sky / Blue"}] as const).map(o=><button key={o.k} onClick={()=>setFavoriteColor(v.ref,o.k)} className="w-7 h-7 rounded-full border-2" style={{background:o.c,borderColor:favColors[v.ref]===o.k?"var(--ink)":"var(--line)"}} aria-label={o.label} title={o.label}/>)}{favColors[v.ref]&&<span className="text-[11px] font-bold opacity-70 capitalize">{favColors[v.ref]}</span>}</div><div className="flex flex-wrap gap-1.5 mt-3"><button onClick={()=>{copyText(`${v.text} — ${v.ref}`);showToast("Verse copied")}} className="chip !py-1.5 !text-[12px]">Copy</button><button onClick={()=>speak(v.text)} className="chip !py-1.5 !text-[12px]">Speak</button><button onClick={()=>readFavInContext(v)} className="chip !py-1.5 !text-[12px] font-bold">Read in Context</button><button onClick={()=>removeFavVerse(v.ref)} className="chip !py-1.5 !text-[12px] text-red-600">Remove</button></div></article>})}</div>}
        </div>
        <div className="card p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-2 items-center"><h3 className="font-black text-[19px]">Recently Read</h3><div className="flex gap-1.5"><button onClick={clearHistoryFn} className="btn px-4 py-2 border text-sm font-bold">Clear History</button></div></div><p className="text-[13px] opacity-60 mt-1">Last {historySorted.length} of {readHistory.length} chapters read.</p>{historySorted.length===0?<p className="text-[13px] opacity-60 mt-3">Nothing in history yet — open a chapter and mark it read to start your history.</p>:historyGroups.map(g=>g.items.length?<div key={g.label} className="mt-4"><h4 className="font-black text-[14px]">{g.label}</h4><div className="space-y-2 mt-2">{g.items.map(h=><div key={`${h.key}-${h.ts}`} className="flex flex-wrap justify-between gap-2 items-center p-3 rounded-xl border" style={{borderColor:"var(--line)"}}><div><b className="text-[14px]">{h.key}</b><span className="block text-[12px] opacity-60">{formatHistoryTime(h.ts)}</span></div><button onClick={()=>openChapterKey(h.key)} className="btn px-4 py-2 border text-sm font-bold">Reopen →</button></div>)}</div></div>:null)}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[["Chapters read",`${readChapters.length} / 1189`],["Verses saved",`${saved.length}`],["Day streak",`${streak} days`],["Favorite book",favBook],["Memorize points",`${memStats.points} pts`],["Memorize streak",`🔥 ${memStats.streak} days • Best ${memStats.bestStreak}`],["Rounds played",`${memStats.rounds}`],["Memorize accuracy",`${memAccuracy}%`]].map(([l,v])=><div key={l} className="card p-5"><p className="text-[12px] uppercase tracking-wider font-bold opacity-60">{l}</p><p className="text-[26px] font-black mt-1">{v}</p></div>)}
        </div>
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="card p-5 sm:p-6"><h3 className="font-black text-[19px]">Your Bible heatmap — 66 books</h3><p className="text-[13px] opacity-60 mt-1">Gold = chapters you’ve read. Spin more to fill the map.</p><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">{BOOKS.map(b=>{const n=readChapters.filter(r=>r.startsWith(b.name+" ")).length; const pct=n/b.chapters; return <button key={b.name} onClick={()=>{setCurrent({book:b.name,chapter:1});setTab("random")}} className="p-3 rounded-xl border text-left" style={{borderColor:"var(--line)",background:pct>0?`rgba(181,138,46,${0.18+pct*0.62})`:"var(--surface)"}}><span className="block text-[12px] font-bold leading-tight truncate">{b.name}</span><span className="block text-[11px] opacity-70 mt-1">{n}/{b.chapters} read</span><span className="block h-1.5 rounded-full mt-2 overflow-hidden" style={{background:"rgba(0,0,0,.08)"}}><span className="block h-full" style={{width:`${pct*100}%`,background:"var(--gold)"}}/></span></button>})}</div></div>
          <div className="space-y-5">
            <div className="card p-5"><div className="flex justify-between items-center"><h3 className="font-black">Saved verses ({saved.length})</h3><button onClick={clearAll} className="text-[12px] font-bold text-red-600">Clear data</button></div>{saved.length===0?<p className="text-[13px] opacity-60 mt-3">No saved verses yet. Tap ♥ on any verse — it will live here.</p>:<div className="space-y-2 mt-3 max-h-[320px] overflow-auto pr-1">{saved.map(s=><div key={s.ref} className="p-3 rounded-xl border" style={{borderColor:"var(--line)"}}><p className="text-[13px] leading-snug">“{s.text}”</p><div className="flex justify-between mt-2"><b className="text-[12px]" style={{color:"var(--gold)"}}>{s.ref}</b><button onClick={()=>removeSaved(s.ref)} className="text-[12px] opacity-60">Remove</button></div></div>)}</div>}</div>
            <div className="card p-5"><h3 className="font-black">Highlights ({highlights.length})</h3>{highlights.length===0?<p className="text-[13px] opacity-60 mt-2">Highlight a verse in the reader to see it here.</p>:<div className="space-y-1.5 mt-3">{highlights.map(h=><div key={h.ref} className="flex justify-between text-[13px]"><span className="font-bold">{h.ref}</span><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{background:COLORS.find(c=>c.n===h.color)?.c}}>{h.color}</span></div>)}</div>}</div>
            <div className="card p-5"><h3 className="font-black">Notes ({notes.length})</h3>{notes.length===0?<p className="text-[13px] opacity-60 mt-2">Add a note on any verse in the reader.</p>:<div className="space-y-2 mt-3">{notes.map(n=><div key={n.id} className="p-3 rounded-xl" style={{background:"var(--surface2)"}}><b className="text-[13px]">{n.ref} • {n.date}</b><p className="text-[13px] mt-1">{n.text}</p></div>)}</div>}</div>
            <div className="card p-5"><h3 className="font-black">Bookmarks ({bookmarks.length})</h3>{bookmarks.length===0?<p className="text-[13px] opacity-60 mt-2">No bookmarks yet.</p>:<div className="flex flex-wrap gap-1.5 mt-3">{bookmarks.map(b=><button key={b} onClick={()=>{const m=b.match(/(.+?) (\d+)$/)!; setCurrent({book:m[1],chapter:Number(m[2])});setTab("random")}} className="chip">{b} →</button>)}</div>}</div>
          </div>
        </div>
      </section>
      )}
      {tab==="topics"&&(
      <section className="mt-6">
        <div className="text-center max-w-[640px] mx-auto"><h2 className="serif text-[32px] sm:text-[42px] font-black">Browse by Topic</h2><p className="opacity-75 mt-1">Choose what you need today — a verse for that exact moment will meet you there.</p></div>
        <div className="card p-4 mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/><input value={topicSearch} onChange={e=>setTopicSearch(e.target.value)} placeholder="Search topics..." aria-label="Search topics" className="w-full h-11 pl-10 pr-3 rounded-full border bg-transparent text-[15px]" style={{borderColor:"var(--line)"}}/></div>
          <button onClick={surpriseTopic} className="btn px-5 h-11 text-white shrink-0" style={{background:"var(--gold)"}}>🎲 Surprise Me</button>
          <button onClick={clearTopic} className="btn px-5 h-11 border shrink-0">All Topics</button>
        </div>
        <p className="text-[13px] font-bold mt-4 px-1">{TOPIC_META.filter(m=>m.name.toLowerCase().includes(topicSearch.trim().toLowerCase())||m.desc.toLowerCase().includes(topicSearch.trim().toLowerCase())).length} topics {topicSearch?`for “${topicSearch}”`:""}</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-3">
          {TOPIC_META.filter(m=>m.name.toLowerCase().includes(topicSearch.trim().toLowerCase())||m.desc.toLowerCase().includes(topicSearch.trim().toLowerCase())).map(m=>{const verses=TOPIC_VERSES[m.name]||[]; const sample=verses[0]; const active=topicSel===m.name; return (
          <article key={m.name} className="card p-4 sm:p-5 text-left flex flex-col hover:-translate-y-1 transition" style={{outline:active?"2px solid var(--gold)":"none",background:`linear-gradient(180deg, ${m.color} 0%, var(--surface) 52%)`}}>
            <span className="text-[30px]">{m.emoji}</span>
            <h3 className="font-black text-[18px] mt-2">{m.name}</h3>
            <p className="text-[13px] opacity-75 mt-1 flex-1">{m.desc}</p>
            <span className="inline-block mt-2 text-[12px] font-bold px-2 py-1 rounded-full w-fit" style={{background:"var(--surface2)"}}>{verses.length} verses</span>
            {sample&&<div className="mt-3 p-3 rounded-xl border bg-white/60" style={{borderColor:"var(--line)"}}><p className="text-[11px] font-bold uppercase tracking-wider opacity-60">Preview</p><p className="text-[13px] leading-snug mt-1">“{sample.text}”</p><p className="text-[12px] font-bold mt-1" style={{color:"var(--gold)"}}>{sample.ref}</p></div>}
            <div className="flex gap-2 mt-4"><button onClick={()=>selectTopic(m.name)} className="btn px-4 py-2.5 text-white text-sm flex-1" style={{background:"var(--navy)"}}>Get a verse →</button><button onClick={()=>{setTopicSearch(""); selectTopic(m.name);}} className="btn px-3 py-2.5 border text-sm">Open</button></div>
          </article>)})}
        </div>
        {TOPIC_META.filter(m=>m.name.toLowerCase().includes(topicSearch.trim().toLowerCase())||m.desc.toLowerCase().includes(topicSearch.trim().toLowerCase())).length===0&&<p className="text-center opacity-70 mt-8">No topics match “{topicSearch}”. Try “love”, “peace”, or “family”.</p>}
      </section>
      )}
      {tab==="how"&&(
      <section className="mt-6 max-w-[860px] mx-auto">
        <button onClick={()=>setTab("random")} className="btn px-4 py-2 border flex gap-2 items-center text-sm"><ArrowLeft size={15}/> Back</button>
        <div className="card p-6 sm:p-9 mt-4">
          <div className="flex items-center gap-2 mb-4"><span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{background:"var(--navy)"}}><ProperCross size={21}/></span><span className="font-black text-[19px] tracking-tight">Bible Randomizer</span></div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{background:"var(--surface2)"}}><Info size={14}/> A simple guide • 5 minutes to read</span>
          <p className="text-[11px] tracking-[.2em] uppercase font-bold opacity-60 mt-4">How Bible Randomizer works</p>
          <h2 className="serif text-[34px] sm:text-[44px] font-black leading-tight mt-2">Discover New Verses With Every Spin.</h2>
          <p className="mt-3 text-[16px] leading-relaxed opacity-80">Bible Randomizer makes exploring God's Word an exciting experience. Instead of always following the same reading routine, let a random Bible verse or chapter introduce you to passages you might otherwise miss. Generate random verses, explore different books of the Bible, and discover meaningful Scripture to reflect on each day.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">{[["1","Spin or choose","Pick a mode below — Random, Verse, Today, Mood, or Memorize."],["2","Read slowly","One chapter or one verse. Highlight, note, or listen."],["3","Come back tomorrow","Your streak, points, and saved verses keep growing."]].map(([n,t,d])=><div key={n} className="p-4 rounded-2xl border" style={{borderColor:"var(--line)"}}><span className="w-8 h-8 rounded-full grid place-items-center font-black text-white" style={{background:"var(--gold)"}}>{n}</span><b className="block mt-2">{t}</b><p className="text-[13px] opacity-70 mt-1">{d}</p></div>)}</div>
        </div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px] flex gap-2 items-center"><BookOpen size={20} style={{color:"var(--gold)"}}/> What is Bible Randomizer?</h3><p className="mt-2 opacity-80 leading-relaxed">It covers all 66 books and 1,189 chapters. You do not need to know where to start. The app picks a place, shows real text, and gives you small tools — save, highlight, note, bookmark, listen — so the words stay with you.</p><div className="mt-4 p-4 rounded-2xl" style={{background:"var(--surface2)"}}><b>Example card — what a spin looks like</b><p className="text-[14px] mt-1 opacity-80">You tap <b>SPIN</b> → you land on <b>Psalm 23</b> → you read “The Lord is my shepherd, I lack nothing.” → you tap <b>Mark chapter as read</b>. That chapter turns gold on your heatmap.</p></div></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px]">How to use each mode</h3>
          <div className="space-y-5 mt-4">
            <div><h4 className="font-black">1. Random Chapter</h4><ol className="list-decimal ml-5 mt-1 space-y-1 text-[14px] opacity-80"><li>Tap <b>SPIN — Random Chapter</b> or press <b>Space</b> on your keyboard.</li><li>Read the chapter. Use <b>A− / A+</b> to change text size.</li><li>Tap <b>Mark chapter as read</b> to grow your streak and heatmap.</li><li>Tap <b>Spin again</b> or <b>Prev / Next</b> to move around.</li></ol></div>
            <div><h4 className="font-black">2. Random Verse / Next Promise</h4><p className="text-[14px] opacity-80 mt-1"><b>Next Promise</b> means “show me one more promise.” It does not change Today’s Word. It simply gives you a new single verse to carry — with <b>Copy</b>, <b>Speak</b>, <b>Save</b>, and <b>Read in Context</b>. Recent Promises at the bottom lets you tap back to a verse you just saw.</p></div>
            <div><h4 className="font-black">3. Today’s Word</h4><p className="text-[14px] opacity-80 mt-1">One verse chosen by the calendar, so everyone sees the same verse that day. It resets at midnight, with a countdown on the page. Use <b>Read in Context</b> to open its full chapter (the verse is highlighted and you get <b>Back to Today’s Word</b>), <b>Save</b>, <b>Copy</b>, <b>Speak</b>, and <b>Try Another Verse</b> — which opens Random Verse without changing Today’s Word.</p></div>
            <div><h4 className="font-black">4. By Mood</h4><p className="text-[14px] opacity-80 mt-1">Pick how you are arriving — Anxious, Grieving, Grateful, Lonely, Angry, Hopeful, Fearful, Needing Direction, Tired, or Joyful. You get a short note and three verses. Tap <b>Next Promise ↻</b> on any card for another verse for that mood, or <b>Read in Context</b> to see it in its chapter.</p></div>
            <div><h4 className="font-black">5. Memorize Game — tap-to-fill</h4><ol className="list-decimal ml-5 mt-1 space-y-1 text-[14px] opacity-80"><li>Choose <b>Easy (hide 3)</b>, <b>Medium (hide 6)</b>, or <b>Hard (hide 10)</b>.</li><li>Look at the verse with blanks. Below it is a <b>word bank</b> with the missing words plus 4–6 wrong distractor words.</li><li><b>Tap a word chip</b> to fill the next empty blank. Tap a <b>filled blank</b> to clear it and return the word to the bank.</li><li>A wrong word fills the blank but turns <b>red and shakes</b> and costs <b>−5 points</b>. A correct word earns <b>+10 points</b>.</li><li>Tap <b>Check Answer</b> when all blanks are filled. A perfect round earns a <b>+50 bonus</b> and confetti.</li><li>Use <b>Try Next Challenge ↻</b> for a new verse, <b>Reset</b> to clear blanks and reshuffle the bank, <b>Reveal Answer</b> to see it, and <b>Read in Context</b> to see the verse in its chapter.</li></ol></div>
          </div>
        </div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px]">What does “Read in Context” do?</h3><p className="mt-2 text-[14px] opacity-80 leading-relaxed">It opens the full chapter that contains that verse, highlights your verse in gold, and auto-scrolls to it. You can read the verses around it, then tap the back button to return.</p><div className="mt-3 p-4 rounded-2xl border" style={{borderColor:"var(--line)"}}><b>Example flow</b><p className="text-[14px] mt-1 opacity-80">Mood → Anxious → “Cast all your anxiety on him…” (1 Peter 5:7) → <b>Read in Context</b> → 1 Peter 5 opens, verse 7 highlighted → <b>← Back to Mood</b>. The same flow works from Today’s Word (“← Back to Today’s Word”), Random Verse (“← Back to Verse”), and Memorize (“← Back to Memorize”).</p></div></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px]">Highlight, Notes, Bookmark &amp; Save</h3><ul className="mt-2 space-y-2 text-[14px] opacity-80"><li><b>Highlight:</b> In the chapter reader, hover a verse → <b>Highlight</b> → pick yellow, green, blue, or pink.</li><li><b>Add Notes:</b> Hover a verse → <b>Note</b> → write what stood out → <b>Save note</b>. Notes live in Saved.</li><li><b>Bookmark:</b> Tap <b>Bookmark</b> at the top of a chapter to return to it later.</li><li><b>Save Verses:</b> Tap the heart <b>♥ Save</b> on any verse. Saved verses live in Saved, with a Remove option.</li></ul></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px]">Listen, Theme, Font &amp; Text Size</h3><ul className="mt-2 space-y-2 text-[14px] opacity-80"><li><b>Listen (Audio):</b> Tap <b>Speak / Listen</b> to hear the verse or chapter read aloud with your device’s voice.</li><li><b>Theme:</b> Tap the sun / book / moon button in the header to switch Light → Sepia → Dark.</li><li><b>Font:</b> Tap <b>Serif / Sans</b> in the header to switch type.</li><li><b>Text Size:</b> In the chapter reader, use <b>A− / A+</b> to make the text smaller or larger.</li></ul></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px] flex gap-2 items-center"><Trophy size={20} style={{color:"var(--gold)"}}/> Saved, Heatmap, Stats, Streak &amp; Points</h3><ul className="mt-2 space-y-2 text-[14px] opacity-80"><li><b>Saved:</b> Your saved verses, highlights, notes, and bookmarks in one place.</li><li><b>Heatmap:</b> All 66 books. Gold means chapters you have read. Tap a book to jump to it.</li><li><b>Stats:</b> Chapters read, verses saved, day streak, favourite book, plus Memorize points, rounds, and accuracy.</li><li><b>Reading streak:</b> Grows when you mark chapters as read.</li><li><b>Memorize streak:</b> Shown with a 🔥 flame. It grows when you play on consecutive days. Best streak is your longest run.</li><li><b>Points:</b> +10 per correct word, −5 per wrong word, +50 bonus for a perfect round. Points, rounds, accuracy, and streak are saved for you.</li></ul></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px] flex gap-2 items-center"><Lightbulb size={20} style={{color:"var(--gold)"}}/> Tips</h3><ul className="mt-2 space-y-2 text-[14px] opacity-80"><li>• Press <b>Space</b> to spin a new chapter from anywhere.</li><li>• Use <b>Mood</b> when you need comfort — you do not have to fix anything first.</li><li>• Use <b>Memorize</b> daily for 5 minutes. Read aloud twice, then tap to fill.</li><li>• Save the verses that stop you. Your library becomes a personal psalm book.</li><li>• Come back tomorrow — Today’s Word and your streak are waiting.</li></ul></div>

        <div className="card p-6 sm:p-8 mt-4"><h3 className="font-black text-[22px]">Frequently asked questions</h3><div className="space-y-3 mt-3 text-[14px]"><p><b>Is it free?</b><br/><span className="opacity-80">Yes — 100% free.</span></p><p><b>Do I need an account?</b><br/><span className="opacity-80">No. Just open it and start reading. Your saved verses, notes, and Memorize progress are saved for you in this app.</span></p><p><b>Does it work offline?</b><br/><span className="opacity-80">The verses and chapters included in the app are available in the page. Listening uses your device’s built-in voice, which may need your device’s normal setup. If your connection drops, your already-loaded reading stays on screen.</span></p><p><b>Will Today’s Word change if I tap Next Promise or Try Another Verse?</b><br/><span className="opacity-80">No. Today’s Word stays the same for everyone until midnight. Those buttons open Random Verse instead.</span></p><p><b>What if I tap the wrong word in Memorize?</b><br/><span className="opacity-80">It fills the blank, turns red, shakes, and costs 5 points. Tap that blank to clear it and try another word. Clearing a correct word removes its 10 points; clearing a wrong word gives the 5 points back.</span></p></div></div>

        <div className="text-center mt-6"><button onClick={()=>{setTab("random");window.scrollTo({top:0,behavior:"smooth"})}} className="btn px-7 py-4 text-white text-[16px] flex gap-2 items-center mx-auto" style={{background:"var(--navy)"}}>Start Exploring <ArrowRight size={18}/></button><p className="text-[13px] opacity-60 mt-3">Back to Random Chapter — spin once and see where you land.</p></div>
      </section>
      )}
      {tab==="about"&&(
        <InfoShell eyebrow="About Us" title="About Bible Randomizer" onReturn={returnToApp}>
          <p className="text-[18px] leading-relaxed">Making Bible reading more exciting through discovery, exploration, and unexpected encounters with Scripture.</p>
          <section><InfoH>Why Bible Randomizer?</InfoH><p className="mt-2">Deciding what to read in the Bible isn&apos;t always easy. Sometimes we return to the same familiar passages, follow a particular reading order, or spend more time choosing where to begin than actually reading. Bible Randomizer offers a different way to approach Scripture. Instead of always deciding what to read next, you can let a random selection introduce you to a Bible verse or chapter. One click can take you to a passage from a book you haven&apos;t opened in a while or a verse you may never have noticed before. Our goal is to make exploring the Bible simple, enjoyable, and accessible while encouraging readers to spend more time discovering God&apos;s Word. Whether you&apos;re beginning your Bible reading journey, looking for daily inspiration, or hoping to explore beyond your usual selections, Bible Randomizer gives you another way to get started.</p></section>
          <section><InfoH>What You Can Do Here</InfoH>
            <InfoSub>Discover Random Bible Verses</InfoSub><p className="mt-1">Looking for something meaningful to read? Use our random Bible verse generator to discover a verse from Scripture. Each selection offers an opportunity to pause, reflect, and explore a message you might not have encountered otherwise.</p>
            <InfoSub>Explore Random Bible Chapters</InfoSub><p className="mt-1">Go beyond individual verses and discover entire chapters from different books of the Bible. Our random chapter generator gives you a simple way to explore Scripture without having to choose your next reading in advance.</p>
            <InfoSub>Find Scripture in a Different Way</InfoSub><p className="mt-1">You don&apos;t always need to follow the same reading order to spend meaningful time in the Bible. Randomize your selections, explore unfamiliar passages, and allow your curiosity to guide your reading.</p>
            <InfoSub>Make Bible Reading a Regular Habit</InfoSub><p className="mt-1">A random verse or chapter can be a simple starting point for your daily Scripture reading. Return whenever you want a new passage to read, something to reflect on, or an opportunity to learn more about the Bible.</p>
          </section>
          <section><InfoH>Our Approach</InfoH><p className="mt-2">We believe that exploring the Bible should be straightforward and accessible to everyone. That&apos;s why Bible Randomizer provides simple tools that help you discover verses and chapters without complicated steps or a fixed reading schedule. There is no single starting point you have to follow. You can begin with a random verse, explore a complete chapter, or keep generating new selections whenever you feel like reading more. Whether you spend a few minutes with one verse or take time to study an entire chapter, every visit is another opportunity to engage with Scripture.</p></section>
          <section><InfoH>Get in Touch</InfoH><p className="mt-2">We&apos;re always happy to hear from people who use Bible Randomizer. If you have questions, feedback, suggestions, or ideas for new features, we&apos;d love to hear from you.</p><p className="mt-2">Email: <EmailLink/></p><p className="mt-2">Thank you for making Bible Randomizer part of your Scripture exploration.</p></section>
          <div><button onClick={returnToApp} className="btn px-6 py-3.5 text-white text-[15px]" style={{background:"var(--navy)"}}>Visit Bible Randomizer and Discover a Random Verse</button></div>
        </InfoShell>
      )}

      {tab==="contact"&&(
        <InfoShell eyebrow="Contact Us" title="Contact Us" onReturn={returnToApp}>
          <p className="text-[18px] leading-relaxed">Have a question, suggestion, or something you&apos;d like to share? We&apos;d be happy to hear from you! At Bible Randomizer, we welcome feedback from everyone who uses our tools to explore Scripture. Whether you have a question about generating random Bible verses, want to suggest an improvement, encountered a technical issue, or simply want to share your experience, we&apos;re always glad to hear from you.</p>
          <section><InfoH>How to Reach Us</InfoH><p className="mt-2">The easiest way to get in touch is by email. Send your message to:</p><p className="mt-2">Email: <EmailLink/></p><p className="mt-2">We aim to respond to genuine inquiries as soon as possible. Please allow a little time for us to review and reply to your message.</p></section>
          <section><InfoH>What Can You Contact Us About?</InfoH>
            <ul className="list-disc ml-5 mt-2 space-y-2"><li><b>Questions and General Inquiries</b> — Ask us questions about how Bible Randomizer works or about its features.</li><li><b>Feedback and Suggestions</b> — Share suggestions for new tools, improvements, or ideas that could make discovering and reading the Bible more engaging.</li><li><b>Technical Issues</b> — Tell us if a verse is not displaying correctly or if a feature is not working as expected.</li><li><b>Bible Content and Accuracy</b> — Report an error you noticed in a verse, chapter, or reference so we can review it.</li><li><b>Partnerships and Collaborations</b> — Reach out about educational, ministry, or promotional collaboration opportunities.</li></ul>
          </section>
          <section><InfoH>Frequently Asked Questions</InfoH>
            <p className="mt-3"><b>Q: Is Bible Randomizer free to use?</b><br/>A: Bible Randomizer is designed to make exploring Scripture accessible and straightforward. You can use its Bible randomization tools to discover verses and passages without needing to follow a fixed reading order.</p>
            <p className="mt-3"><b>Q: How can I suggest a new feature?</b><br/>A: Simply send us an email describing your idea. We welcome suggestions that could make discovering and reading the Bible more engaging.</p>
            <p className="mt-3"><b>Q: What should I include when reporting a technical problem?</b><br/>A: Please describe what happened, which feature you were using, and the device or browser you&apos;re using. Screenshots are also helpful when available.</p>
            <p className="mt-3"><b>Q: Can I share Bible Randomizer with others?</b><br/>A: Absolutely! You&apos;re welcome to share Bible Randomizer with friends, family, fellow readers, Bible study groups, and anyone who might enjoy discovering Scripture in a different way.</p>
          </section>
          <p>Thank you for visiting Bible Randomizer and taking the time to get in touch. Your feedback helps us continue improving the experience for everyone.</p>
        </InfoShell>
      )}

      {tab==="privacy"&&(
        <InfoShell eyebrow="Privacy Policy" title="Privacy Policy" lastUpdated="Last Updated: November 14, 2026" onReturn={returnToApp}>
          <p className="text-[18px] leading-relaxed">At Bible Randomizer (accessible at <SiteLink/>), we respect your privacy and are committed to protecting any information you share with us. This Privacy Policy explains what information may be collected when you visit our website, how we use it, and the choices available to you regarding your personal information. By using Bible Randomizer, you acknowledge that you have read and understood this Privacy Policy.</p>
          <InfoToc items={[{id:"privacy-1",label:"1. Information We Collect"},{id:"privacy-2",label:"2. Cookies and Tracking Technologies"},{id:"privacy-3",label:"3. How We Use Your Information"},{id:"privacy-4",label:"4. How We Share Your Information"},{id:"privacy-5",label:"5. Third-Party Services and Advertising"},{id:"privacy-6",label:"6. Data Retention"},{id:"privacy-7",label:"7. Data Security"},{id:"privacy-8",label:"8. International Data Transfers"},{id:"privacy-9",label:"9. Children's Privacy"},{id:"privacy-10",label:"10. Links to Other Websites"},{id:"privacy-11",label:"11. Your Privacy Rights"},{id:"privacy-12",label:"12. Changes to This Privacy Policy"},{id:"privacy-13",label:"13. Contact Us"}]}/>
          <section><InfoH id="privacy-1">1. Information We Collect</InfoH><InfoSub>Personal Information</InfoSub><p className="mt-1">You do not need to create an account or register to use Bible Randomizer. We do not ask you to sign up to discover a verse or chapter. If you choose to contact us by email, however, we may collect the information you share with us, including your name, your email address, the contents of your message, and any additional information you voluntarily provide. We use that information only to read and respond to your message.</p><InfoSub>Information Collected Automatically</InfoSub><p className="mt-1">When you visit our website, technical information may be collected automatically, such as your IP address, browser type and version, device type and operating system, the pages you visit and the time you spend on them, the date and time of your visit, the referring website, and other technical or diagnostic information. This information helps us understand how the website is used and keep it working well.</p></section>
          <section><InfoH id="privacy-2">2. Cookies and Tracking Technologies</InfoH><p className="mt-2">Cookies are small text files that may be stored on your device when you visit a website. They can help a website remember preferences, understand how visitors use the site, and keep basic features working. Bible Randomizer may use cookies or similar technologies for essential purposes, such as keeping the website available and secure; functional purposes, such as remembering a display preference; and analytics purposes, such as understanding which pages are visited. You can manage cookies through your browser settings, including blocking or deleting cookies. Some features may not work as expected if cookies are disabled.</p></section>
          <section><InfoH id="privacy-3">3. How We Use Your Information</InfoH><p className="mt-2">We may use information we collect to operate and maintain the website, improve the user experience, respond to your inquiries, maintain the security of the website, analyze performance and understand how visitors use the site, and meet our legal obligations. We do not sell your personal information.</p></section>
          <section><InfoH id="privacy-4">4. How We Share Your Information</InfoH><p className="mt-2">We do not sell or rent your personal information. We may share information in limited circumstances: with service providers who help operate, host, secure, or improve the website; where required by law or to comply with a legal process; in connection with a business transfer, such as a merger or acquisition; and to protect our rights, safety, or property, or the rights, safety, or property of others.</p></section>
          <section><InfoH id="privacy-5">5. Third-Party Services and Advertising</InfoH><p className="mt-2">We may rely on third-party services for hosting, security, and performance. Those services may collect technical information as described in this policy and as described in their own policies.</p><p className="mt-2"><b>Advertising:</b> Bible Randomizer does NOT currently participate in Google AdSense or any other third-party advertising network. If advertising is introduced in the future, this Privacy Policy will be updated.</p><p className="mt-2"><b>Analytics:</b> We may introduce analytics tools in the future to better understand how visitors use the website. If we do, this Privacy Policy will be updated to describe those tools.</p></section>
          <section><InfoH id="privacy-6">6. Data Retention</InfoH><p className="mt-2">We retain information only as long as necessary for the purposes described in this policy. Emails you send us are retained for as long as needed to respond to your inquiry and maintain a record of our correspondence. Technical information may be retained for security and troubleshooting purposes. We may retain information for a longer period where required by law.</p></section>
          <section><InfoH id="privacy-7">7. Data Security</InfoH><p className="mt-2">We use reasonable measures designed to protect information from unauthorized access, loss, misuse, or disclosure. However, no method of transmission over the internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p></section>
          <section><InfoH id="privacy-8">8. International Data Transfers</InfoH><p className="mt-2">Our hosting providers and service providers may be located in different countries. If information is transferred internationally, it may be processed in a country whose data protection laws differ from those in your country. By using Bible Randomizer, you understand that your information may be transferred to and processed in other countries.</p></section>
          <section><InfoH id="privacy-9">9. Children&apos;s Privacy</InfoH><p className="mt-2">Bible Randomizer is intended for general audiences. We do not knowingly collect personal information from children under 13 without parental consent where such consent is required by law. If you believe a child has provided personal information to us, please contact us so we can review and address it.</p></section>
          <section><InfoH id="privacy-10">10. Links to Other Websites</InfoH><p className="mt-2">Our website may contain links to other websites. We are not responsible for the privacy practices, content, or policies of those third-party websites. We encourage you to review the privacy policy of any website you visit.</p></section>
          <section><InfoH id="privacy-11">11. Your Privacy Rights</InfoH><p className="mt-2">Depending on where you live, you may have rights relating to your personal information, including the right to access your information, request correction of inaccurate information, request deletion of your information, object to certain processing, request restriction of processing, and withdraw consent where processing is based on consent. To exercise any of these rights, please contact us by email. We may need to verify your identity before responding to your request.</p></section>
          <section><InfoH id="privacy-12">12. Changes to This Privacy Policy</InfoH><p className="mt-2">We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last Updated&quot; date at the top of this page. The revised policy becomes effective when it is published on this page. We encourage you to review this page periodically.</p></section>
          <section><InfoH id="privacy-13">13. Contact Us</InfoH><p className="mt-2">If you have questions about this Privacy Policy, please contact us.</p><p className="mt-2">Email: <EmailLink/><br/>Website: <SiteLink/></p><p className="mt-2">Thank you.</p></section>
        </InfoShell>
      )}

      {tab==="terms"&&(
        <InfoShell eyebrow="Terms of Service" title="Terms of Service" lastUpdated="Last Updated: November 14, 2026" onReturn={returnToApp}>
          <p className="text-[18px] leading-relaxed">Welcome to Bible Randomizer (<SiteLink/>). These Terms of Service explain the rules and conditions that apply when you access or use our website and its features. By visiting or using Bible Randomizer, you agree to these Terms. If you do not agree, please discontinue using the website.</p>
          <InfoToc items={[{id:"terms-1",label:"1. About Bible Randomizer"},{id:"terms-2",label:"2. Acceptable Use"},{id:"terms-3",label:"3. Use of Tools"},{id:"terms-4",label:"4. Bible Content and Accuracy"},{id:"terms-5",label:"5. Intellectual Property"},{id:"terms-6",label:"6. Third-Party Links and Services"},{id:"terms-7",label:"7. Website Availability"},{id:"terms-8",label:"8. Disclaimer of Warranties"},{id:"terms-9",label:"9. Limitation of Liability"},{id:"terms-10",label:"10. Privacy"},{id:"terms-11",label:"11. Changes to These Terms"},{id:"terms-12",label:"12. Governing Law"},{id:"terms-13",label:"13. Contact Us"}]}/>
          <section><InfoH id="terms-1">1. About Bible Randomizer</InfoH><p className="mt-2">Bible Randomizer provides tools for discovering random Bible verses and chapters. It is intended to make discovering and reading Scripture easier, more engaging, and more accessible, whether you are beginning your reading journey, looking for daily inspiration, or exploring beyond your usual selections.</p></section>
          <section><InfoH id="terms-2">2. Acceptable Use</InfoH><p className="mt-2">You agree to use Bible Randomizer responsibly and lawfully. You must not use the website for unlawful, fraudulent, or harmful activity; disrupt, damage, or interfere with the website or its services; introduce viruses or other malicious code; attempt to gain unauthorized access to the website or its systems; use automated means to collect information in a way that burdens our services; or copy or redistribute content in a way that violates intellectual property rights. We reserve the right to restrict access for misuse.</p></section>
          <section><InfoH id="terms-3">3. Use of Tools</InfoH><p className="mt-2">The random selections provided by Bible Randomizer are not personalized spiritual advice. Random selections do not follow a theological, chronological, or devotional order, and you are responsible for your own interpretation of any passage you discover. Translations, features, and selections may vary. We may modify or discontinue features at any time. Bible Randomizer does not replace thoughtful study or consultation with religious teachers.</p></section>
          <section><InfoH id="terms-4">4. Bible Content and Accuracy</InfoH><p className="mt-2">We aim to provide reliable Bible content, but we cannot guarantee that it will always be accurate or error-free. Differences in translations, formatting, punctuation, and verse numbering may occur. If you notice an error, please report it to <EmailLink/> so we can review it.</p></section>
          <section><InfoH id="terms-5">5. Intellectual Property</InfoH><p className="mt-2">The design, branding, text, layout, graphics, and features of Bible Randomizer are protected by applicable intellectual property laws. You may use the website for personal, educational, and lawful purposes, and you may share links to Bible Randomizer. You may not reproduce, republish, distribute, modify, or commercially exploit the website&apos;s content or features without permission, except as permitted by law. Bible translations shown on the website are subject to the copyright of their respective holders.</p></section>
          <section><InfoH id="terms-6">6. Third-Party Links and Services</InfoH><p className="mt-2">Our website may contain links to third-party websites or services for your convenience. We have no control over, and do not guarantee, the content, policies, or practices of those third parties. Your use of third-party links and services is at your own discretion.</p></section>
          <section><InfoH id="terms-7">7. Website Availability</InfoH><p className="mt-2">We aim to keep Bible Randomizer accessible, but we do not guarantee that it will be uninterrupted, secure, or error-free. Availability may be affected by maintenance, technical issues, or hosting problems. We may modify, suspend, or discontinue the website or any feature without notice.</p></section>
          <section><InfoH id="terms-8">8. Disclaimer of Warranties</InfoH><p className="mt-2">Bible Randomizer is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind. We make no guarantees regarding availability, freedom from errors, accuracy, suitability, or the continued availability of any feature or translation.</p></section>
          <section><InfoH id="terms-9">9. Limitation of Liability</InfoH><p className="mt-2">To the fullest extent permitted by law, we are not liable for direct, indirect, incidental, consequential, or special damages arising from your use of, or inability to use, Bible Randomizer, including damages from errors, interruptions, unauthorized access, reliance on content, or third-party issues. Nothing in these Terms excludes liability where such exclusion is prohibited by law.</p></section>
          <section><InfoH id="terms-10">10. Privacy</InfoH><p className="mt-2">Your use of Bible Randomizer is also governed by our <button onClick={()=>goTo("privacy")} className="font-bold underline" style={{color:"var(--gold)"}}>Privacy Policy</button>. Please review it to understand how information is collected and used.</p></section>
          <section><InfoH id="terms-11">11. Changes to These Terms</InfoH><p className="mt-2">We may revise these Terms from time to time. When we do, we will update the &quot;Last Updated&quot; date at the top of this page. Your continued use of Bible Randomizer after changes are published constitutes your acceptance of the revised Terms.</p></section>
          <section><InfoH id="terms-12">12. Governing Law</InfoH><p className="mt-2">These Terms are interpreted in accordance with applicable laws. Any dispute relating to Bible Randomizer will be resolved in accordance with the applicable legal requirements and jurisdiction.</p></section>
          <section><InfoH id="terms-13">13. Contact Us</InfoH><p className="mt-2">If you have questions about these Terms, please contact us.</p><p className="mt-2">Email: <EmailLink/><br/>Website: <SiteLink/></p><p className="mt-2">Thank you.</p></section>
        </InfoShell>
      )}
    </main>

    <footer className="border-t py-6" style={{borderColor:"var(--line)"}}><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="flex flex-col sm:flex-row justify-between gap-2 text-[13px] opacity-70"><span className="flex items-center gap-2"><span className="w-7 h-7 rounded-md grid place-items-center shrink-0" style={{background:"var(--navy)"}}><ProperCross size={14}/></span> <b>Bible Randomizer</b> — Discover New Verses With Every Spin.</span><span>Private • Saved securely for you • 100% free</span></div><nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-4 text-[13px] font-bold"><button onClick={()=>goTo("about")} className="underline px-1 py-1">About Us</button><span aria-hidden="true" className="opacity-50">|</span><button onClick={()=>goTo("contact")} className="underline px-1 py-1">Contact Us</button><span aria-hidden="true" className="opacity-50">|</span><button onClick={()=>goTo("privacy")} className="underline px-1 py-1">Privacy Policy</button><span aria-hidden="true" className="opacity-50">|</span><button onClick={()=>goTo("terms")} className="underline px-1 py-1">Terms of Service</button><span aria-hidden="true" className="opacity-50">|</span><button onClick={()=>goTo("how")} className="underline px-1 py-1">How It Works</button></nav></div></footer>
    {toast&&<div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-white text-[14px] font-bold shadow-xl pop max-w-[92vw] text-center" style={{background:"var(--navy)"}}>{toast}</div>}
  </div>
  );
}
