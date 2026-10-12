<script>
"use strict";
/* =====================================================================
   1. DATA
   Every factual record carries `src` (keys into SOURCES) and `v`
   (verification): "wiki" = read from the Witcher fandom wiki,
   "guide" = community guide(s), "unverified" = conflicting or single
   weak source. Recommendations are labelled separately from facts.
   No map coordinates are stored anywhere: none were verified.
   ===================================================================== */

const SOURCES = {
  fandom:   {name:"Witcher Wiki (fandom), read via MediaWiki API", url:"https://witcher.fandom.com/wiki/The_Witcher_3:_Wild_Hunt"},
  fandomRm: {name:"Witcher Wiki: The Witcher 3 abilities (Remastered trees)", url:"https://witcher.fandom.com/wiki/The_Witcher_3_abilities"},
  fextraRm: {name:"Fextralife: Skills and Talent Trees (Remastered)", url:"https://thewitcher3.wiki.fextralife.com/Skills_and_Talent_Trees"},
  fandomMut:{name:"Witcher Wiki: Mutations (Blood and Wine)", url:"https://witcher.fandom.com/wiki/Mutations_(Blood_and_Wine)"},
  fandomMg: {name:"Witcher Wiki: The Witcher 3 mutagens", url:"https://witcher.fandom.com/wiki/The_Witcher_3_mutagens"},
  fandomGw: {name:"Witcher Wiki: Gwent deck pages (all factions)", url:"https://witcher.fandom.com/wiki/Gwent"},
  fextraGw: {name:"Fextralife: Gwent Cards", url:"https://thewitcher3.wiki.fextralife.com/Gwent+Cards"},
  fandomAch:{name:"Witcher Wiki: The Witcher 3 achievements", url:"https://witcher.fandom.com/wiki/The_Witcher_3_achievements"},
  fandomNG: {name:"Witcher Wiki: New Game +", url:"https://witcher.fandom.com/wiki/New_Game_%2B"},
  fandomMerch:{name:"Witcher Wiki: The Witcher 3 merchants (and Armorer, Blacksmith, Herbalist, Innkeeper, junk pages)", url:"https://witcher.fandom.com/wiki/The_Witcher_3_merchants"},
  fandomPang:{name:"Witcher Wiki: Pang of Conscience (Bugs section)", url:"https://witcher.fandom.com/wiki/Pang_of_Conscience"},
  fandomBDF:{name:"Witcher Wiki: Bovine Defense Force Initiative", url:"https://witcher.fandom.com/wiki/Bovine_Defense_Force_Initiative"},
  gpmMoney:{name:"GamingProMax: Witcher 3 Remastered money exploits (29 Sep 2026)", url:"https://gamingpromax.com/witcher-3-wild-hunt-remastered-best-money-exploits-crown-farming-guide/"},
  srPang:{name:"Screen Rant: Pang of Conscience glitch not patched (Dec 2021)", url:"https://screenrant.com/witcher-3-pang-conscience-money-exploit-not-patched/"},
  fandomHoSQ:{name:"Witcher Wiki: Hearts of Stone quests and Whatsoever a Man Soweth...", url:"https://witcher.fandom.com/wiki/Whatsoever_a_Man_Soweth..."},
  fandomBaWQ:{name:"Witcher Wiki: Blood and Wine quests", url:"https://witcher.fandom.com/wiki/Blood_and_Wine_quests"},
  fandomDecide:{name:"Witcher Wiki: The Witcher 3 decision checklist", url:"https://witcher.fandom.com/wiki/The_Witcher_3_decision_checklist"},
  fandomPatch:{name:"Witcher Wiki: patch notes 1.04 to 1.30", url:"https://witcher.fandom.com/wiki/Patch_1.07_(The_Witcher_3)"},
  fextra:   {name:"Fextralife Witcher 3 Wiki", url:"https://thewitcher3.wiki.fextralife.com/"},
  gc:       {name:"game-checklists.com Witcher 3 checklists", url:"https://game-checklists.com/witcher3/all-quests-checklist.html"},
  gcPop:    {name:"game-checklists.com Places of Power", url:"https://game-checklists.com/witcher3/all-places-of-power-checklist.html"},
  gcCon:    {name:"game-checklists.com Witcher contracts", url:"https://game-checklists.com/witcher3/all-witcher-contracts-checklist.html"},
  gcHunt:   {name:"game-checklists.com Scavenger hunts", url:"https://game-checklists.com/witcher3/all-scavenger-hunts-checklist.html"},
  thegamer: {name:"TheGamer: Witcher 3 quests that auto-fail", url:"https://www.thegamer.com/witcher-3-autofail-quests/"},
  vulkk:    {name:"vulkk.com witcher gear guides", url:"https://vulkk.com/2022/12/17/how-to-get-the-griffin-school-gear-in-the-witcher-3/"},
  witcherhour:{name:"WitcherHour gear and Places of Power", url:"https://witcherhour.com/place-of-power-locations/"},
  consolepulse:{name:"ConsolePulse grandmaster set bonuses", url:"https://consolepulse.com/multiplatform/the-witcher/guides/witcher-3-grandmaster-gear-sets-bonuses-compared"},
  g4g:      {name:"guides4gamers quest pages", url:"https://guides4gamers.com/witcher-3-wild-hunt/quests/master-armorers/"},
  fextraMon:{name:"Fextralife Monsters table (mirrors in-game bestiary)", url:"https://thewitcher3.wiki.fextralife.com/Monsters"},
  fextraAlc:{name:"Fextralife Potions, Decoctions, Oils, Bombs", url:"https://thewitcher3.wiki.fextralife.com/Potions"},
  rec:      {name:"Guide recommendation (editorial, not a game fact)", url:""}
};

const VERIFY = {
  wiki:{label:"Wiki-sourced", cls:"tag-ok", tip:"Read from the Witcher fandom wiki."},
  guide:{label:"Community guide", cls:"", tip:"From community guides. Verify in game."},
  unverified:{label:"Unverified", cls:"tag-warn", tip:"Sources conflict or only one weak source."},
  rec:{label:"Recommendation", cls:"tag-accent", tip:"Editorial advice, not a game fact."}
};

/* Artwork: Witcher 3 wallpapers hotlinked from wallpapercave.com (requested by the
   site owner, personal non-commercial use). Each has an Unsplash-licensed
   Picsum photo as fallback, then a CSS gradient if both fail. */
const WC = f => "https://wallpapercave.com/wp/wp" + f;
const PS = (id, w = 1200, h = 700) => `https://picsum.photos/id/${id}/${w}/${h}`;
const ART = {
  hero:       {src:WC("1854896.jpg"), fb:PS(229,1600,900), pos:"62% 40%", alt:"Geralt walking through a mountain valley"},
  whiteorchard:{src:WC("1854640.jpg"), fb:PS(33), pos:"55% 40%", alt:"Geralt fighting a griffin"},
  velen:      {src:WC("1854888.jpg"), fb:PS(95), pos:"60% 40%", alt:"Witches flying past a dead tree under the moon"},
  novigrad:   {src:WC("1854914.jpg"), fb:PS(164), pos:"50% 45%", alt:"A walled city across the water"},
  skellige:   {src:WC("1854897.jpg"), fb:PS(1018), pos:"50% 60%", alt:"Longships beached on a stormy shore"},
  kaermorhen: {src:WC("1854908.jpg"), fb:PS(235), pos:"50% 40%", alt:"A ruined stone tower in the snow"},
  toussaint:  {src:PS(142), fb:PS(116), pos:"50% 50%", alt:"A chateau at the end of a long road"},
  vizima:     {src:PS(232), fb:PS(190), pos:"50% 50%", alt:"Street lamps at night"},
  isle:       {src:WC("1854909.jpg"), fb:PS(135), pos:"50% 50%", alt:"A mist-covered island at night"},
  bestiary:   {src:WC("1854874.jpg"), fb:PS(120), pos:"55% 40%", alt:"Geralt facing a fiend"},
  gear:       {src:WC("1854627.png"), fb:PS(29), pos:"70% 40%", alt:"Two witcher swords before a dark castle"},
  gwent:      {src:WC("1854910.jpg"), fb:PS(75), pos:"50% 30%", alt:"Painted portraits of Triss, Geralt and Ciri"},
  builds:     {src:WC("1854628.jpg"), fb:PS(190), pos:"70% 30%", alt:"Geralt standing over a slain beast"},
  quests:     {src:WC("1854716.jpg"), fb:PS(17), pos:"60% 40%", alt:"Geralt and Ciri on horseback"},
  hunt:       {src:WC("1854673.jpg"), fb:PS(29), pos:"50% 30%", alt:"The generals of the Wild Hunt"},
  hos:        {src:WC("1854907.jpg"), fb:PS(95), pos:"50% 40%", alt:"A dead tree under a pale moon"},
  baw:        {src:PS(116), fb:PS(142), pos:"50% 50%", alt:"Cypress-lined hills"},
  alchemy:    {src:WC("1854642.jpg"), fb:PS(120), pos:"60% 35%", alt:"Ciri holding a torch before a monster"},
  collect:    {src:WC("1854643.jpg"), fb:PS(229), pos:"50% 35%", alt:"A leshen in a dark forest"},
  money:      {src:PS(75), fb:PS(116), pos:"50% 50%", alt:"Grapes on the vine"},
  golem:      {src:WC("1854875.jpg"), fb:PS(29), pos:"70% 35%", alt:"Geralt leaping at a stone golem"}
};

/* ---------- Regions ---------- */
const REGIONS = [
  {id:"white-orchard", name:"White Orchard", art:"whiteorchard", level:"1-4", lvlNote:"estimate", dlc:null,
   blurb:"The prologue village and fields. Every White Orchard side quest fails once you leave for Vizima, so finish them first.",
   pop:6, v:"guide", src:["gcPop","witcherhour"]},
  {id:"velen", name:"Velen (No Man's Land)", art:"velen", level:"5-10", lvlNote:"estimate", dlc:null,
   blurb:"War-torn swamps and villages around Crow's Perch, Crookback Bog and Midcopse. Home of the Bloody Baron storyline.",
   pop:6, popNote:"Sources disagree (6 vs 8) because some count Alness under Velen.", v:"guide", src:["gcPop","fextra"]},
  {id:"novigrad", name:"Novigrad and Oxenfurt", art:"novigrad", level:"10-14", lvlNote:"estimate", dlc:null,
   blurb:"The free city and the university town. Most master crafting, Gwent tournaments and the Hearts of Stone opening live here.",
   pop:2, v:"guide", src:["gcPop","fextra"]},
  {id:"skellige", name:"Skellige", art:"skellige", level:"14-19", lvlNote:"estimate", dlc:null,
   blurb:"Island clans, sea travel and the richest density of Places of Power: nine across the archipelago.",
   pop:9, v:"guide", src:["gcPop"]},
  {id:"kaer-morhen", name:"Kaer Morhen", art:"kaermorhen", level:"19-22", lvlNote:"estimate", dlc:null,
   blurb:"The witcher keep in the mountains. Prologue dream, Wolf School diagrams and the battle in Act II.",
   pop:1, v:"guide", src:["gcPop"]},
  {id:"toussaint", name:"Toussaint", art:"toussaint", level:"34+", lvlNote:"DLC recommended level", dlc:"baw",
   blurb:"The Blood and Wine duchy. Grandmaster crafting, Corvo Bianco, Mutations and the Skellige Gwent deck.",
   pop:5, popNote:"Only 3 of the 5 are named in our sources so far.", v:"guide", src:["gcPop","fandom"]},
  {id:"vizima", name:"Vizima (Royal Palace)", art:"vizima", level:"prologue", dlc:null,
   blurb:"Visited during the prologue quest Imperial Audience. No Places of Power.", pop:0, v:"guide", src:["gc"]},
  {id:"isle-of-mists", name:"Isle of Mists", art:"isle", level:"22", lvlNote:"main quest level", dlc:null,
   blurb:"Visited during the main quest The Isle of Mists. Sailing there fails a long list of quests (see Quest Guides).",
   pop:0, v:"guide", src:["gc","thegamer"]}
];

/* ---------- Location directory (no coordinates: text hints only) ---------- */
const LOCATION_TYPES = {
  pop:{label:"Place of Power", icon:"ph-sparkle"},
  signpost:{label:"Signpost", icon:"ph-signpost"},
  blacksmith:{label:"Blacksmith", icon:"ph-hammer"},
  armorer:{label:"Armorer", icon:"ph-shield"},
  merchant:{label:"Merchant", icon:"ph-storefront"},
  gwent:{label:"Gwent player", icon:"ph-cards"},
  treasure:{label:"Treasure", icon:"ph-treasure-chest"},
  nest:{label:"Monster nest", icon:"ph-skull"},
  quest:{label:"Quest hub", icon:"ph-scroll"}
};
const L = (id, region, type, name, hint, v = "guide", src = ["gcPop"]) => ({id, region, type, name, hint, v, src});
const LOCATIONS = [
  // White Orchard
  L("wo-pop-aard","white-orchard","pop","Aard Place of Power (Sawmill)","North of the sawmill."),
  L("wo-pop-igni","white-orchard","pop","Igni Place of Power (Mill)","In the cemetery south of the sawmill."),
  L("wo-pop-axii","white-orchard","pop","Axii Place of Power (Nilfgaardian Garrison)","In the woods west of the cemetery."),
  L("wo-pop-quen1","white-orchard","pop","Quen Place of Power (Broken Bridge)","East of the village."),
  L("wo-pop-quen2","white-orchard","pop","Quen Place of Power (Sawmill)","South of the griffin nest."),
  L("wo-pop-yrden","white-orchard","pop","Yrden Place of Power (Abandoned Village)","East of the ruins. A bear guards it."),
  L("wo-sp-sawmill","white-orchard","signpost","Sawmill","Signpost.",undefined,["gc"]),
  L("wo-sp-mill","white-orchard","signpost","Mill","Signpost.",undefined,["gc"]),
  L("wo-sp-garrison","white-orchard","signpost","Nilfgaardian Garrison","Signpost.",undefined,["gc"]),
  L("wo-sp-bridge","white-orchard","signpost","Broken Bridge","Signpost.",undefined,["gc"]),
  L("wo-sp-abandoned","white-orchard","signpost","Abandoned Village","Signpost.",undefined,["gc"]),
  L("wo-smith-garrison","white-orchard","blacksmith","Nilfgaardian Garrison Blacksmith","Amateur blacksmith at the garrison.",undefined,["fextra"]),
  L("wo-tomira","white-orchard","merchant","Tomira (herbalist)","Herbalist in White Orchard. May stock decoction formulas (random stock).",undefined,["fextraAlc"]),
  L("wo-gwent-bram","white-orchard","gwent","Bram and Elsa","Sell the Decoy special card.","wiki",["fandomGw"]),
  L("wo-gwent-aldert","white-orchard","gwent","Aldert Geert","Win the Zoltan Chivay card from him.","wiki",["fandomGw"]),
  // Velen
  L("ve-pop-lornruk","velen","pop","Quen Place of Power (Lornruk)","Under the drawbridge."),
  L("ve-pop-midcopse","velen","pop","Yrden Place of Power (Midcopse)","Elven ruins visited during Magic Lamp. Missable: the lamp is only obtainable during Wandering in the Dark."),
  L("ve-pop-oak-aard","velen","pop","Aard Place of Power (Ancient Oak)","Near the Ancient Oak."),
  L("ve-pop-downwarren","velen","pop","Yrden Place of Power (Downwarren)","On a hill to the west."),
  L("ve-pop-oak-igni","velen","pop","Igni Place of Power (Ancient Oak)","Accessible after The Whispering Hillock."),
  L("ve-pop-bald","velen","pop","Quen Place of Power (Road to Bald Mountain)","Accessible after the main quest Bald Mountain."),
  L("ve-sp-crows","velen","signpost","Crow's Perch","Signpost and Baron's keep.",undefined,["gc"]),
  L("ve-sp-midcopse","velen","signpost","Midcopse","Signpost.",undefined,["gc"]),
  L("ve-sp-downwarren","velen","signpost","Downwarren","Signpost.",undefined,["gc"]),
  L("ve-sp-oak","velen","signpost","Ancient Oak","Signpost.",undefined,["gc"]),
  L("ve-fergus","velen","armorer","Fergus Graem (journeyman armorer)","Crow's Perch.",undefined,["fextra"]),
  L("ve-yoana","velen","armorer","Yoana (master armorer)","Crow's Perch. Becomes a master armorer through the quest Master Armorers (level 24).",undefined,["g4g","vulkk"]),
  L("ve-lindenvale","velen","blacksmith","Lindenvale blacksmith","Amateur smith. Sells the Wolven and Mastercrafted Feline map fragments.","unverified",["vulkk"]),
  L("ve-smiths","velen","blacksmith","Amateur blacksmiths","Blackbough, Oreton and Bald Mountain.",undefined,["fextra"]),
  L("ve-gwent-baron","velen","gwent","Bloody Baron","Velen Players opponent at Crow's Perch.",undefined,["gc"]),
  L("ve-gwent-haddy","velen","gwent","Haddy (Midcopse)","Velen Players. Win Vernon Roche.","wiki",["fandomGw"]),
  L("ve-gwent-boat","velen","gwent","Oreton boatwright","Velen Players. Win Letho of Gulet.","wiki",["fandomGw"]),
  L("ve-gwent-sage","velen","gwent","Old Sage (Benek)","Velen Players opponent.",undefined,["gc"]),
  L("ve-gwent-inn","velen","gwent","Inn at the Crossroads innkeep","Playing Innkeeps. Win Menno Coehoorn; also sells Commander's Horn.","wiki",["fandomGw"]),
  L("ve-tr-moonblade","velen","treasure","Moonblade (Spoils of War chest)","Underwater chest in the Pontar, south-west of Mulbrydale and north-east of Crow's Perch.",undefined,["fextra"]),
  L("ve-tr-unicorn","velen","treasure","Black Unicorn (guarded treasure)","On the coast north-west of the Inn at the Crossroads. Also a possible Kernun drop.","unverified",["fextra"]),
  L("ve-tr-deithwen","velen","treasure","Deithwen (Sunken Chest)","Sunken Chest treasure in the Mire. Other sources list it as a quest reward instead.","unverified",["fextra"]),
  // Novigrad
  L("no-pop-igni","novigrad","pop","Igni Place of Power (Electors' Square)","On a grassy rise."),
  L("no-pop-axii","novigrad","pop","Axii Place of Power (Alness)","On a rocky hill to the south-east. Some sources file Alness under Velen.","unverified"),
  L("no-sp-electors","novigrad","signpost","Electors' Square","Signpost.",undefined,["gc"]),
  L("no-sp-glory","novigrad","signpost","Glory Lane","Signpost.",undefined,["gc"]),
  L("no-sp-hierarch","novigrad","signpost","Hierarch Square","Signpost.",undefined,["gc"]),
  L("no-sp-oxenfurt","novigrad","signpost","Oxenfurt","Signpost.",undefined,["gc"]),
  L("no-hattori","novigrad","blacksmith","Eibhear Hattori (master blacksmith)","Novigrad dumpling shop. Unlocked as master through Of Swords and Dumplings (level 24). Sells the relic Crossbow. Exact district varies by source.","guide",["g4g","fextra"]),
  L("no-upper","novigrad","blacksmith","Upper Mill blacksmith","Master blacksmith (Hearts of Stone area).",undefined,["fextra"]),
  L("no-journey","novigrad","blacksmith","Fish Market and Oxenfurt smiths","Journeyman blacksmiths.",undefined,["fextra"]),
  L("no-ofieri","novigrad","merchant","Ofieri merchant (Upper Mill)","Hearts of Stone. Sells the Ofieri Crossbow (Master).",undefined,["fextra"]),
  L("no-otto","novigrad","merchant","Otto Bamber (herbalist hut)","North-east of Oxenfurt. May stock several potion and bomb formulas (random stock).",undefined,["fextraAlc"]),
  L("no-gwent-vivaldi","novigrad","gwent","Vimme Vivaldi","Big City Players. Win Vesemir.","wiki",["fandomGw"]),
  L("no-gwent-dijkstra","novigrad","gwent","Sigismund Dijkstra","Big City Players. Win Esterad Thyssen.","wiki",["fandomGw"]),
  L("no-gwent-serenity","novigrad","gwent","Marquise Serenity","Big City Players. Win Morvran Voorhis.","wiki",["fandomGw"]),
  L("no-gwent-scoia","novigrad","gwent","Scoia'tael merchant","Big City Players. Win Cirilla.","wiki",["fandomGw"]),
  L("no-gwent-stjepan","novigrad","gwent","Stjepan (Alchemy Inn, Oxenfurt)","Playing Innkeeps. Win Yennefer.","wiki",["fandomGw"]),
  L("no-gwent-jonas","novigrad","gwent","Jonas (New Port Inn)","Sells Scorch and the Eredin leader card.","wiki",["fandomGw"]),
  // Skellige
  L("sk-pop-svorlag","skellige","pop","Igni Place of Power (Svorlag)","Near Svorlag."),
  L("sk-pop-urialla","skellige","pop","Quen Place of Power (Urialla Harbor)","On the trail to Yngvar's Fang."),
  L("sk-pop-kt-quen","skellige","pop","Quen Place of Power (Kaer Trolde Harbor)","Tunnels under Kaer Trolde, reached when siding with Cerys in The King's Gambit."),
  L("sk-pop-kt-igni","skellige","pop","Igni Place of Power (Kaer Trolde Harbor)","Coastal cave visited during The Sunstone."),
  L("sk-pop-kt-axii","skellige","pop","Axii Place of Power (Kaer Trolde Harbor)","Rocky outcrop near the sea."),
  L("sk-pop-gedyneith","skellige","pop","Aard Place of Power (Gedyneith)","Cave near a cyclops."),
  L("sk-pop-druids","skellige","pop","Yrden Place of Power (Druids' Camp)","Woods to the east."),
  L("sk-pop-fornhala","skellige","pop","Axii Place of Power (Fornhala)","Near Fornhala."),
  L("sk-pop-harviken","skellige","pop","Yrden Place of Power (Harviken)","Mountain path to the west."),
  L("sk-sp-kt","skellige","signpost","Kaer Trolde Harbor","Signpost.",undefined,["gc"]),
  L("sk-sp-svorlag","skellige","signpost","Svorlag","Signpost.",undefined,["gc"]),
  L("sk-sp-gedyneith","skellige","signpost","Gedyneith","Signpost.",undefined,["gc"]),
  L("sk-sp-harviken","skellige","signpost","Harviken","Signpost.",undefined,["gc"]),
  L("sk-smith","skellige","blacksmith","Kaer Trolde and Kaer Muire smiths","Journeyman. No master smith in Skellige.",undefined,["fextra"]),
  L("sk-yolar","skellige","merchant","Yolar (herbalist)","Cave beneath Gedyneith, Ard Skellig. May stock Maribor Forest.",undefined,["fextraAlc"]),
  L("sk-gwent-ermion","skellige","gwent","Ermion","Gwent: Skellige Style. Win Leshen.","wiki",["fandomGw"]),
  L("sk-gwent-crach","skellige","gwent","Crach an Craite","Gwent: Skellige Style. Win Draug.","wiki",["fandomGw"]),
  L("sk-gwent-gremist","skellige","gwent","Gremist","Gwent: Skellige Style. Win Mysterious Elf.","wiki",["fandomGw"]),
  L("sk-gwent-urialla","skellige","gwent","Urialla Harbor innkeep","Sells Scorch.","wiki",["fandomGw"]),
  L("sk-tr-bearxbow","skellige","treasure","Ursine Crossbow diagram","Skeleton in a cave south-west of the Old Watchtower, Spikeroog.",undefined,["vulkk"]),
  // Kaer Morhen
  L("km-pop","kaer-morhen","pop","Place of Power (Kaer Morhen)","Far north of the zone. Sign type not confirmed in our sources.","unverified"),
  L("km-zoltan","kaer-morhen","blacksmith","Zoltan Chivay","Temporary amateur smith during the Kaer Morhen chapter.",undefined,["fextra"]),
  L("km-gwent-lambert","kaer-morhen","gwent","Lambert","Gwent: Old Pals. Win Triss Merigold.","wiki",["fandomGw"]),
  // Toussaint
  L("to-pop-arthach","toussaint","pop","Place of Power (Arthach Palace Ruins)","North bog."),
  L("to-pop-rioux","toussaint","pop","Place of Power (Rioux-Cannes Outpost)","West of Beauclair Palace."),
  L("to-pop-termes","toussaint","pop","Place of Power (Termes Palace Ruins)","East of Gelenser Farm."),
  L("to-sp-hauteville","toussaint","signpost","Hauteville","Signpost.",undefined,["gc"]),
  L("to-sp-tourney","toussaint","signpost","Tourney Grounds","Signpost.",undefined,["gc"]),
  L("to-sp-gelenser","toussaint","signpost","Gelenser Farm","Signpost.",undefined,["gc"]),
  L("to-lafargue","toussaint","blacksmith","Lazare Lafargue (grandmaster smith)","The only grandmaster armorer and blacksmith. Unlocked through Master Master Master Master! (level 40). Exact spot varies by source.","guide",["vulkk","gcHunt"]),
  L("to-trentin","toussaint","blacksmith","Trentin (master)","Hauteville. Available on arrival.",undefined,["fextra"]),
  L("to-tourney-smith","toussaint","blacksmith","Tourney Grounds and Arthach smiths","Sell the Toussaint Crossbow (Magic).",undefined,["fextra"]),
  L("to-gwent-monnier","toussaint","gwent","Martin Monnier (Gran'place)","Starts Never Fear, Skellige's Here.",undefined,["gc"]),
  L("to-gwent-barrel","toussaint","gwent","Barrel and Bung Inn innkeep","Win Cerys (Skellige deck).","wiki",["fandomGw"]),
  L("to-gwent-franco","toussaint","gwent","Francollarts innkeep","Win Ermion (Skellige deck).","wiki",["fandomGw"]),
  L("to-gwent-armorer","toussaint","gwent","Hauteville armorer","Win Kambi (transforms into Hemdall).","wiki",["fandomGw"]),
  L("to-tr-aerondight","toussaint","quest","Hermit at Lac Celavy","Starts There Can Be Only One (Aerondight). West of Corvo Bianco.",undefined,["vulkk"])
];

/* ---------- Quests ---------- */
const QUEST_TYPES = {
  main:{label:"Main quest", icon:"ph-crown-simple"},
  side:{label:"Secondary", icon:"ph-scroll"},
  contract:{label:"Witcher contract", icon:"ph-sword"},
  treasure:{label:"Treasure hunt", icon:"ph-treasure-chest"},
  gwent:{label:"Gwent quest", icon:"ph-cards"},
  hos:{label:"Hearts of Stone", icon:"ph-heart-break"},
  baw:{label:"Blood and Wine", icon:"ph-wine"}
};
let _qi = 0;
const Q = (type, name, region, level, extra = {}) => ({
  id: extra.id || (type + "-" + name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")),
  order: _qi++, type, name, region, level, act: extra.act || null,
  prereq: extra.prereq || null, missable: extra.missable || null, target: extra.target || null,
  rewards: extra.rewards || null, steps: extra.steps || null, note: extra.note || null,
  v: extra.v || "guide", src: extra.src || ["gc"]
});
const QUESTS = [
  // Main: Prologue
  Q("main","Kaer Morhen","kaer-morhen",1,{act:"Prologue"}),
  Q("main","Lilac and Gooseberries","white-orchard",1,{act:"Prologue"}),
  Q("main","The Beast of White Orchard","white-orchard",3,{act:"Prologue",rewards:"Thunderbolt potion formula (given by Vesemir).",src:["gc","fextraAlc"]}),
  Q("main","The Incident at White Orchard","white-orchard",2,{act:"Prologue"}),
  Q("main","Imperial Audience","vizima",2,{act:"Prologue",missable:"Starting this quest by leaving White Orchard fails every unfinished White Orchard side quest except Faithful Friend.",src:["gc","thegamer"]}),
  // Velen
  Q("main","The Nilfgaardian Connection","velen",5,{act:"Act I: Velen"}),
  Q("main","Bloody Baron","velen",6,{act:"Act I: Velen"}),
  Q("main","Family Matters","velen",5,{act:"Act I: Velen"}),
  Q("main","A Princess in Distress","velen",5,{act:"Act I: Velen"}),
  Q("main","Hunting a Witch","velen",5,{act:"Act I: Velen"}),
  Q("main","Wandering in the Dark","velen",6,{act:"Act I: Velen",missable:"The Magic Lamp, needed for the Midcopse Yrden Place of Power, is only obtainable during this quest."}),
  Q("main","Ladies of the Wood","velen",6,{act:"Act I: Velen"}),
  Q("main","The Whispering Hillock","velen",5,{act:"Act I: Velen"}),
  // Novigrad
  Q("main","Pyres of Novigrad","novigrad",10,{act:"Act I: Novigrad"}),
  Q("main","Novigrad Dreaming","novigrad",7,{act:"Act I: Novigrad"}),
  Q("main","Broken Flowers","novigrad",11,{act:"Act I: Novigrad"}),
  Q("main","Get Junior","novigrad",12,{act:"Act I: Novigrad",note:"Gangs of Novigrad becomes available afterwards and is missable."}),
  Q("main","A Favor for Radovid","novigrad",9,{act:"Act I: Novigrad"}),
  Q("main","Count Reuven's Treasure","novigrad",12,{act:"Act I: Novigrad"}),
  Q("main","The Play's the Thing","novigrad",11,{act:"Act I: Novigrad"}),
  Q("main","A Poet Under Pressure","novigrad",13,{act:"Act I: Novigrad",note:"The wiki states the Blood and Wine opening notice appears after this quest."}),
  // Skellige
  Q("main","Destination: Skellige","skellige",16,{act:"Act I: Skellige",src:["fextra"]}),
  Q("main","The King is Dead - Long Live the King","skellige",16,{act:"Act I: Skellige"}),
  Q("main","Echoes of the Past","skellige",17,{act:"Act I: Skellige"}),
  Q("main","Missing Persons","skellige",15,{act:"Act I: Skellige"}),
  Q("main","Nameless","skellige",14,{act:"Act I: Skellige"}),
  // Act II
  Q("main","Ugly Baby","kaer-morhen",15,{act:"Act II",missable:"Starting Ugly Baby fails Following the Thread and The Last Wish.",src:["gc","thegamer"]}),
  Q("main","The Isle of Mists","isle-of-mists",22,{act:"Act II",missable:"Sailing to the Isle of Mists fails: Ciri's Room, The Fall of the House of Reardon, Ghosts of the Past, Return to Crookback Bog, Berengar's Blade, the Keira Metz questline, the Radovid assassination questline, A Dangerous Game and the Triss romance.",src:["gc","thegamer"]}),
  Q("main","The Battle of Kaer Morhen","kaer-morhen",24,{act:"Act II"}),
  Q("main","Blood on the Battlefield","kaer-morhen",20,{act:"Act II",note:"Level and position in our source look out of order.",v:"unverified"}),
  Q("main","Bald Mountain","velen",26,{act:"Act II"}),
  // Act III
  Q("main","Final Preparations","novigrad",26,{act:"Act III"}),
  Q("main","Battle Preparations","skellige",28,{act:"Act III",missable:"Fails The Lord of Undvik, Possession and The King's Gambit if still open.",src:["gc","thegamer"]}),
  Q("main","The Sunstone","skellige",28,{act:"Act III"}),
  Q("main","Child of the Elder Blood","skellige",28,{act:"Act III",note:"Skjall's Grave becomes available afterwards and is missable."}),
  Q("main","On Thin Ice","skellige",null,{act:"Act III",missable:"Fails Contract: Devil by the Well if it is still open.",src:["gc","thegamer"]}),
  Q("main","Tedd Deireadh, The Final Age","skellige",null,{act:"Act III"}),
  Q("main","Something Ends, Something Begins","skellige",null,{act:"Act III"}),

  // Secondary (selected)
  Q("side","Master Armorers","velen",24,{prereq:"Ask Fergus Graem or the Hierarch Square journeyman armorer about master work.",rewards:"Yoana becomes a master armorer (unlocks Mastercrafted armor).",steps:["Recover smithing tools from the Clan Tordarroch forge cave on Undvik (an ice troll guards it).","Bring an archgriffin acid gland (links to Contract: The Griffin from the Highlands).","Return to Crow's Perch."],note:"One search summary also lists this as an Isle of Mists cutoff. Unverified.",src:["g4g","vulkk"]}),
  Q("side","Of Swords and Dumplings","novigrad",24,{prereq:"Ask a journeyman blacksmith for master-level work.",rewards:"Eibhear Hattori works as a master blacksmith.",src:["g4g"]}),
  Q("side","Following the Thread","novigrad",null,{missable:"Fails when Ugly Baby starts.",src:["thegamer"]}),
  Q("side","The Last Wish","skellige",null,{missable:"Fails when Ugly Baby starts. Required for the Yennefer romance.",src:["thegamer"]}),
  Q("side","Ghosts of the Past","velen",null,{missable:"Fails when you sail to the Isle of Mists.",src:["thegamer"]}),
  Q("side","Return to Crookback Bog","velen",null,{missable:"Fails when you sail to the Isle of Mists.",src:["thegamer"]}),
  Q("side","Berengar's Blade","novigrad",null,{missable:"Fails when you sail to the Isle of Mists.",src:["thegamer"]}),
  Q("side","A Dangerous Game","novigrad",null,{missable:"Fails when you sail to the Isle of Mists.",rewards:"Choice-dependent Gwent hero card: John Natalis or Isengrim Faoiltiarna.",src:["thegamer","fandomGw"]}),
  Q("side","Shock Therapy","velen",null,{rewards:"Iorveth Gwent hero card.",v:"wiki",src:["fandomGw"]}),
  Q("side","A Matter of Life and Death","novigrad",null,{rewards:"Gwent cards at the Vegelbud estate, including Dandelion. One-time only.",missable:"The Vegelbud Gwent cards are one-attempt.",src:["gc","fandomGw"]}),
  Q("side","The Lord of Undvik","skellige",null,{missable:"Fails when Battle Preparations starts.",src:["thegamer"]}),
  Q("side","Possession","skellige",null,{missable:"Fails when Battle Preparations starts.",src:["thegamer"]}),
  Q("side","The King's Gambit","skellige",null,{missable:"Fails when Battle Preparations starts. Also locks out Madman Lugos and Blue Boy quests and the Cave of Dreams.",src:["thegamer"]}),
  Q("side","Where the Cat and Wolf Play...","velen",25,{note:"Free DLC quest about the Cat witcher Gaetan, released 3 July 2015. It is not the Blood and Wine opener.",v:"wiki",src:["fandom"]}),

  // Contracts
  Q("contract","Contract: Devil by the Well","white-orchard",2,{target:"Noonwraith (specter)",missable:"Fails at On Thin Ice if still open.",src:["gcCon","thegamer"]}),
  Q("contract","Contract: Woodland Beast","velen",6,{target:"Necrophages and Scoia'tael",src:["gcCon"]}),
  Q("contract","Contract: Patrol Gone Missing","velen",7,{target:"Wyvern (draconid)",src:["gcCon"]}),
  Q("contract","Contract: Shrieker","velen",8,{target:"Cockatrice (draconid)",src:["gcCon"]}),
  Q("contract","Contract: Jenny o' the Woods","velen",10,{target:"Nightwraith (specter)",src:["gcCon"]}),
  Q("contract","Contract: The Merry Widow","velen",10,{target:"Mourntart, grave hag (necrophage)",src:["gcCon"]}),
  Q("contract","Contract: Swamp Thing","velen",12,{target:"Ignis Fatuus, foglet (necrophage)",src:["gcCon"]}),
  Q("contract","Contract: Mysterious Tracks","velen",20,{target:"Chort (relict)",src:["gcCon"]}),
  Q("contract","Contract: Phantom of the Trade Route","velen",23,{target:"Royal wyvern (draconid)",src:["gcCon"]}),
  Q("contract","Contract: The Griffin from the Highlands","velen",24,{target:"Archgriffin (hybrid)",src:["gcCon"]}),
  Q("contract","Contract: The Beast of Honorton","velen",25,{target:"Alghouls (necrophage)",src:["gcCon"]}),
  Q("contract","Contract: An Elusive Thief","novigrad",13,{target:"Doppler",src:["gcCon"]}),
  Q("contract","Contract: The Apiarian Phantom","novigrad",14,{target:"Wild Hunt hound",src:["gcCon"]}),
  Q("contract","Contract: Deadly Delights","novigrad",15,{target:"Succubus",src:["gcCon"]}),
  Q("contract","Contract: Lord of the Wood","novigrad",25,{target:"Kernun, young leshen (relict)",src:["gcCon"]}),
  Q("contract","Contract: The Creature from Oxenfurt Forest","novigrad",35,{target:"Opinicus, archgriffin (hybrid)",src:["gcCon"]}),
  Q("contract","Contract: Strange Beast","skellige",16,{target:"Hagubman, nekker warrior (ogroid)",src:["gcCon"]}),
  Q("contract","Contract: Muire D'yaeblen","skellige",18,{target:"Abaya, water hag (necrophage)",src:["gcCon"]}),
  Q("contract","Contract: Here Comes the Groom","skellige",19,{target:"Melusine, ekhidna (vampire)",src:["gcCon"]}),
  Q("contract","Contract: Missing Miners","skellige",27,{target:"Wham-a-Wham, rock troll (ogroid)",src:["gcCon"]}),
  Q("contract","Contract: Dragon","skellige",28,{target:"Forktail (draconid)",src:["gcCon"]}),
  Q("contract","Contract: Missing Son","skellige",29,{target:"Morvudd, fiend (relict)",src:["gcCon"]}),
  Q("contract","Contract: Bovine Blues","toussaint",38,{target:"Not captured in our sources",src:["gcCon"]}),
  Q("contract","Contract: The Tufo Monster","toussaint",48,{target:"Not captured in our sources",src:["gcCon"]}),

  // Scavenger hunts
  Q("treasure","Scavenger Hunt: Griffin School Gear","velen",11,{rewards:"Basic Griffin diagrams (all six in Velen). Steel sword at Hindhold, silver sword at Lornruk.",src:["gcHunt","vulkk"]}),
  Q("treasure","Scavenger Hunt: Cat School Gear","novigrad",17,{rewards:"Basic Feline diagrams. Steel sword at Drahim Castle, silver sword at Est Tayiar (both Velen side of the map).",note:"Sources disagree on whether this hunt is filed under Novigrad or Velen.",v:"unverified",src:["gcHunt","vulkk"]}),
  Q("treasure","Scavenger Hunt: Bear School Gear","skellige",20,{rewards:"Basic Ursine diagrams, including the Ursine Crossbow (cave south-west of the Old Watchtower, Spikeroog).",src:["gcHunt","vulkk"]}),
  Q("treasure","Scavenger Hunt: Wolf School Gear","kaer-morhen",14,{rewards:"Basic Wolven diagrams.",src:["gcHunt"]}),
  Q("treasure","Scavenger Hunt: Viper School Gear","white-orchard",6,{note:"Placement in White Orchard is inconsistent in our source.",v:"unverified",src:["gcHunt"]}),
  Q("treasure","Master Master Master Master!","toussaint",40,{rewards:"Unlocks Lazare Lafargue and the Grandmaster scavenger hunts for Feline, Griffin, Manticore, Ursine and Wolven gear.",src:["gcHunt","vulkk"]}),
  Q("treasure","Scavenger Hunt: Grandmaster Manticore Gear","toussaint",40,{rewards:"Manticore diagrams. The first is at the Bastoy prison ruins (south-west of the Astre ruins).",src:["vulkk"]}),

  // Gwent quests
  Q("gwent","Collect 'Em All","novigrad",null,{note:"Umbrella quest across regions. Some cards are one-time rewards.",src:["gc"]}),
  Q("gwent","Gwent: Playing Innkeeps","velen",null,{rewards:"Menno Coehoorn, Tibor Eggebracht, Yennefer and more.",src:["gc","fandomGw"]}),
  Q("gwent","Gwent: Velen Players","velen",null,{rewards:"Vernon Roche (Haddy), Letho of Gulet (boatwright).",src:["gc","fandomGw"]}),
  Q("gwent","Gwent: Big City Players","novigrad",null,{prereq:"Harborside notice board or Vimme Vivaldi.",rewards:"Esterad Thyssen, Morvran Voorhis, Cirilla, Vesemir.",src:["gc","fandomGw"]}),
  Q("gwent","Gwent: Old Pals","novigrad",null,{prereq:"Can start during Broken Flowers.",rewards:"Eithne (Zoltan), Saesenthessis (Roche), Triss (Lambert), Geralt (Thaler).",missable:"Play Roche before A Deadly Plot.",src:["gc","fandomGw"]}),
  Q("gwent","Gwent: Playing Thaler","novigrad",null,{rewards:"Geralt of Rivia hero card.",missable:"Fails if Thaler dies in Reason of State.",src:["gc","fandomGw"]}),
  Q("gwent","Gwent: Skellige Style","skellige",null,{prereq:"After Echoes of the Past and Practicum in Advanced Alchemy.",rewards:"Draug, Leshen, Mysterious Elf.",src:["gc","fandomGw"]}),
  Q("gwent","High Stakes","novigrad",26,{prereq:"1,000 crown entry fee.",rewards:"Foltest: The Steel-Forged and Francesca: Queen of Dol Blathanna leader cards. Rewards are one attempt only.",missable:"One attempt: losing forfeits the tournament cards and the Gwent Master achievement.",src:["gc","fandomGw","fandomAch"]}),
  Q("gwent","Never Fear, Skellige's Here","toussaint",null,{prereq:"Martin Monnier, Gran'place.",src:["gc"]}),
  Q("gwent","To Everything - Turn, Turn, Tournament!","toussaint",null,{prereq:"Beauclair notice boards.",src:["gc"]}),

  // Hearts of Stone
  Q("hos","Evil's Soft First Touches","novigrad",32,{prereq:"Contract: Monster in the Sewers notice at the Seven Cats Inn board.",note:"Guides often say any Velen or Novigrad notice board; the wiki names the Seven Cats Inn.",src:["gc","fandom"]}),
  Q("hos","Dead Man's Party","novigrad",33,{src:["gc"]}),
  Q("hos","A Midnight Clear","novigrad",33,{missable:"Available during Dead Man's Party. Fails at Scenes From a Marriage.",src:["gc"]}),
  Q("hos","Open Sesame!","novigrad",34,{missable:"Borsodi auction is one-time: Viper armor diagrams (Baroness Mignole), Shopaholic achievement, Ofieri Crossbow (Relic) and Venomous steel sword diagram from the vault. Avid Collector and A Dark Legacy are only available during this quest.",src:["gc","vulkk"]}),
  Q("hos","Scenes From a Marriage","novigrad",35,{src:["gc"]}),
  Q("hos","Whatsoever a Man Soweth...","novigrad",36,{rewards:"Iris (if you defeat O'Dimm). Venomous silver sword diagram if you side with Olgierd.",missable:"Both rewards depend on your choice.",src:["gc","vulkk"]}),
  Q("hos","From Ofier's Distant Shores","novigrad",33,{note:"Hearts of Stone treasure hunt.",src:["gcHunt"]}),

  // Blood and Wine
  Q("baw","Envoys, Wineboys","velen",34,{prereq:"Notice board notice (Stonecutters' Settlement). The wiki says it appears after A Poet Under Pressure.",src:["gc","fandom"]}),
  Q("baw","The Beast of Toussaint","toussaint",35,{missable:"David and Golyat achievement (crossbow bolt to Golyat's eye) is only possible here.",src:["gc","fandomAch"]}),
  Q("baw","The Warble of a Smitten Knight","toussaint",35,{missable:"Fails at Capture the Castle when you meet de la Tour.",rewards:"Archery contest prizes include Geralt of Rivia's Crossbow.",src:["gc","fextra"]}),
  Q("baw","Blood Run","toussaint",36,{src:["gc"]}),
  Q("baw","La Cage au Fou","toussaint",38,{src:["gc"]}),
  Q("baw","Amidst the Mill's Grist","toussaint",39,{missable:"Only available between La Cage au Fou and Wine is Sacred.",src:["gc"]}),
  Q("baw","Turn and Face the Strange","toussaint",null,{rewards:"Unlocks Mutations.",v:"wiki",src:["fandomMut"]}),
  Q("baw","Wine is Sacred","toussaint",42,{src:["gc"]}),
  Q("baw","There Can Be Only One","toussaint",null,{prereq:"Speak with the Hermit at Lac Celavy and prove the five virtues.",rewards:"Aerondight (silver relic).",missable:"Embodiment of the Five Virtues achievement is tied to this quest.",src:["vulkk","fandomAch"]}),
  Q("baw","Capture the Castle","toussaint",47,{src:["gc"]}),
  Q("baw","The Night of Long Fangs","toussaint",47,{note:"Story branch point. Exact ordering of the branches needs wiki confirmation.",v:"unverified",src:["gc"]}),
  Q("baw","Duck, Duck, Goosed!","toussaint",47,{missable:"Fails when you leave the Land of a Thousand Fables.",src:["gc"]}),
  Q("baw","Tesham Mutna","toussaint",49,{src:["gc"]}),
  Q("baw","The Perks of Being a Jailbird","toussaint",49,{missable:"Fails when Be It Ever So Humble starts.",src:["gc"]}),
  Q("baw","Be It Ever So Humble...","toussaint",49,{src:["gc"]})
];

/* ---------- Skills: see section 1c (Remastered trees). Mutations below are Blood and Wine. ---------- */
const MUTATIONS = [
  {id:"m-tb", name:"Toxic Blood", color:"green", ap:2, cost:"2 green greater mutagens", req:[]},
  {id:"m-eu", name:"Euphoria", color:"green", ap:3, cost:"3 green", req:["m-tb"]},
  {id:"m-ms", name:"Mutated Skin", color:"green+red", ap:5, cost:"3 green, 2 red", req:["m-eu"]},
  {id:"m-dc", name:"Deadly Counter", color:"red", ap:2, cost:"2 red", req:[]},
  {id:"m-bb", name:"Bloodbath", color:"red", ap:3, cost:"3 red", req:["m-dc"]},
  {id:"m-msn", name:"Magic Sensibilities", color:"blue", ap:2, cost:"2 blue", req:[]},
  {id:"m-pc", name:"Piercing Cold", color:"blue", ap:3, cost:"3 blue", req:["m-msn"]},
  {id:"m-com", name:"Conductors of Magic", color:"blue+red", ap:5, cost:"3 blue, 2 red", req:["m-pc"]},
  {id:"m-ce", name:"Cat Eyes", color:"green+red", ap:5, cost:"3 green, 2 red", req:["m-bb","m-eu"]},
  {id:"m-meta", name:"Metamorphosis", color:"all", ap:7, cost:"3 green, 2 red, 2 blue", req:["m-ce"]},
  {id:"m-ar", name:"Adrenaline Rush", color:"blue+red", ap:5, cost:"3 blue, 2 red", req:["m-pc","m-bb"]},
  {id:"m-sl", name:"Second Life", color:"all", ap:7, cost:"2 blue, 3 red, 2 green", req:["m-ar"]}
];
/* Strengthened Synapses: extra slots after 2 / 4 / 8 / 12 researched mutations. */
const MUTATION_SLOT_STEPS = [2, 4, 8, 12];
const MUTAGEN_SLOT_LEVELS = [4, 9, 16, 28];

/* Builds: editorial recommendations for the Remastered trees. Every allocation is
   checked against the unlock rules when loaded. */
const BUILDS = [
  {id:"b-feline", name:"Fast Steel", style:"combat", gear:"Feline (light)", tag:"Combat", level:32, art:"builds",
   summary:"Dodge-led fast attacks into Whirl and Crippling Strike, with Battle Frenzy crits and a light-armor Cat School core.",
   playstyle:["Dodge or roll, then chain fast attacks while Muscle Memory is primed.","Whirl groups once adrenaline is up; Crippling Strike makes crits stick.","Undying and Fleet-Footed cover mistakes."],
   alloc:{"c-muscle-memory":3,"c-three-strikes":3,"c-undying":3,"c-fleet-footed":2,"c-whirl":3,"c-crippling-strike":3,"c-razor-focus":2,"c-arrow-deflection":1,"g-cat-school-techniques":3,"g-battle-frenzy":3,"g-adrenaline-burst":2,"g-survival-instinct":3},
   equip:["c-muscle-memory","c-three-strikes","c-whirl","c-undying","c-fleet-footed","c-crippling-strike","c-razor-focus","c-arrow-deflection","g-battle-frenzy","g-cat-school-techniques","g-adrenaline-burst","g-survival-instinct"],
   mutagens:["red","red","",""], mutations:[], sim:{armor:"light", pieces:4, adrenaline:3},
   equipment:["Feline armor set (light)","Feline or Aerondight silver sword","Black Blood and Thunderbolt for long fights"]},
  {id:"b-griffin", name:"Igni Firestorm", style:"signs", gear:"Griffin (medium)", tag:"Signs", level:31, art:"alchemy",
   summary:"Firestream and Melt Armor, amplified by Catalyst inside Yrden and by Focus with adrenaline. Quen keeps you standing.",
   playstyle:["Lay Yrden, then hold Firestream on enemies inside it for the Catalyst bonus.","Alternate Signs to stack Chain Reaction.","Keep Active Shield up between engagements."],
   alloc:{"s-melt-armor":3,"s-firestream":3,"s-sustained-glyphs":2,"s-magic-trap":2,"s-shockwave":1,"s-catalyst":3,"s-focus":3,"s-exploding-shield":3,"s-active-shield":3,"s-chain-reaction":2,"g-griffin-school-techniques":3,"g-anger-management":2},
   equip:["s-melt-armor","s-firestream","s-catalyst","s-focus","s-chain-reaction","s-magic-trap","s-exploding-shield","s-active-shield","s-sustained-glyphs","s-shockwave","g-griffin-school-techniques","g-anger-management"],
   mutagens:["blue","blue","blue",""], mutations:[], sim:{armor:"medium", pieces:4, adrenaline:2},
   equipment:["Griffin armor set (medium)","Sign intensity glyphs on armor","Tawny Owl for stamina regen"]},
  {id:"b-euphoria", name:"Euphoria Alchemist", style:"alchemy", gear:"Manticore (medium)", tag:"Alchemy", level:45, art:"collect",
   summary:"High Toxicity as a resource: Endure Pain, High Tolerance and Side Effects, with Toxic Blood and Euphoria mutations. Needs Blood and Wine.",
   playstyle:["Stack decoctions and stay above the safe Toxicity threshold.","Tissue Transmutation and Refreshment provide the buffer.","Meditate with strong alcohol to refill."],
   alloc:{"a-refreshment":3,"a-frenzy":2,"a-endure-pain":3,"a-hunter-instinct":1,"a-acquired-tolerance":3,"a-tissue-transmutation":3,"a-delayed-recovery":3,"a-high-tolerance":3,"a-fast-metabolism":2,"a-side-effects":3,"c-muscle-memory":3,"g-manticore-school-techniques":3,"g-metabolic-control":3},
   equip:["a-refreshment","a-endure-pain","a-tissue-transmutation","a-delayed-recovery","a-high-tolerance","a-side-effects","a-acquired-tolerance","a-fast-metabolism","a-frenzy","c-muscle-memory","g-manticore-school-techniques","g-metabolic-control","a-hunter-instinct"],
   mutagens:["green","green","green",""], mutations:["m-tb","m-eu"], sim:{armor:"medium", pieces:4, adrenaline:1, toxicity:80},
   equipment:["Manticore armor set (Grandmaster)","Ekimmara, Water Hag and Troll decoctions","Strong alcohol for meditation refills"]},
  {id:"b-ursine", name:"Quen Bulwark", style:"hybrid", gear:"Ursine (heavy)", tag:"Hybrid", level:35, art:"hunt",
   summary:"Heavy armor, Crushing Blow and Sunder Armor strong attacks, finishing with Rend, behind an Active Shield.",
   playstyle:["Fast attacks set up Strength Training, then strong attacks fish for Crushing Blow.","Sunder Armor stacks before a Rend.","Active Shield soaks hits and heals."],
   alloc:{"c-arrow-deflection":1,"c-resolve":3,"c-undying":3,"c-muscle-memory":1,"c-strength-training":3,"c-crushing-blow":3,"c-sunder-armor":3,"c-rend":2,"s-exploding-shield":3,"s-active-shield":3,"g-bear-school-techniques":3,"g-gourmand":1,"g-sun-and-stars":2},
   equip:["c-strength-training","c-crushing-blow","c-rend","c-sunder-armor","c-resolve","c-undying","s-exploding-shield","s-active-shield","g-bear-school-techniques","g-gourmand","g-sun-and-stars",null],
   mutagens:["red","red","",""], mutations:[], sim:{armor:"heavy", pieces:4, adrenaline:3},
   equipment:["Ursine armor set (heavy)","Ursine Crossbow","Swallow and Thunderbolt"]}
];

/* ---------- Gear ---------- */
const GEAR_SETS = [
  {id:"feline", name:"Feline (Cat) School", weight:"Light", levels:{basic:17, enhanced:23, superior:29, mastercrafted:34, grandmaster:40},
   levelNote:"One source lists mastercrafted as 31 (armor) and 30 (swords). Basic crossbow is level 29.",
   basic:"All basic diagrams are in Velen. Steel sword at Drahim Castle, silver sword at Est Tayiar.",
   upgrades:"Enhanced hunt starts at Blackbough. Mastercrafted map fragment is sold by the Lindenvale blacksmith.",
   gm:["3 pieces: strong attacks raise fast-attack damage for 5s (10% per piece).","6 pieces: rear attacks deal +50% and stun, costing 1 adrenaline."],
   v:"guide", src:["vulkk","consolepulse"]},
  {id:"griffin", name:"Griffin School", weight:"Medium", levels:{basic:11, enhanced:18, superior:26, mastercrafted:34, grandmaster:40},
   levelNote:"One source lists mastercrafted as 31.",
   basic:"All six basic diagrams are in Velen. Steel sword at Hindhold, silver sword at Lornruk.",
   upgrades:"Enhanced hunts run in Velen; superior and mastercrafted in Skellige.",
   gm:["3 pieces: after a standard Sign, the next Sign within about 3s costs no stamina.","6 pieces: larger Yrden; inside it stamina regen and Sign intensity rise and damage taken drops."],
   v:"guide", src:["vulkk","consolepulse","gcHunt"]},
  {id:"ursine", name:"Ursine (Bear) School", weight:"Heavy", levels:{basic:20, enhanced:25, superior:30, mastercrafted:34, grandmaster:40},
   levelNote:"Enhanced and superior are suggested quest levels, not confirmed equip levels. Basic crossbow is level 29.",
   basic:"Seven basic diagrams in Skellige, including the crossbow (cave south-west of the Old Watchtower, Spikeroog).",
   upgrades:"Enhanced diagrams are all in Skellige; superior and mastercrafted hunts move to Velen.",
   gm:["3 pieces: when Quen breaks, chance to recast it for free (+5% per piece).","6 pieces: Quen ability damage +200%."],
   v:"guide", src:["vulkk","consolepulse","gcHunt"]},
  {id:"wolven", name:"Wolven (Wolf) School", weight:"Medium", levels:{basic:14, enhanced:21, superior:29, mastercrafted:34, grandmaster:40},
   basic:"Basic hunt is filed under Kaer Morhen. A starting map fragment is sold by the Lindenvale blacksmith.",
   upgrades:"Enhanced: Kaer Morhen, Novigrad and Velen. Mastercrafted: Ard Skellig, Undvik, Spikeroog and an underwater chest in west Velen. Grandmaster armor near Termes Palace ruins.",
   gm:["3 pieces: each Bleeding on an enemy gives +1% sword damage per piece (current patch).","6 pieces: each adrenaline point allows more Bleeding stacks (current patch)."],
   versionNote:"Bonuses changed in patch 4.0. Before 4.0: 3 pieces allowed 3 oils at once, 6 pieces made bombs throw without delay.",
   v:"guide", src:["vulkk","consolepulse","gcHunt"]},
  {id:"manticore", name:"Manticore School", weight:"Medium", levels:{grandmaster:40}, dlc:"baw",
   basic:"Grandmaster tier only. Scavenger Hunt: Grandmaster Manticore Gear starts from Lafargue; first diagram at the Bastoy prison ruins.",
   gm:["3 pieces: bombs benefit from crit chance and crit damage bonuses.","6 pieces: +1 charge to every alchemy item."],
   levelNote:"The armor diagram location conflicts between sources.",
   v:"guide", src:["vulkk","consolepulse"]},
  {id:"viper", name:"Viper / Viper Venomous", weight:"Medium", levels:{single:39}, dlc:"hos",
   basic:"Armor diagrams are bought from Baroness Mignole at the Borsodi auction during Open Sesame!. Missable.",
   upgrades:"Venomous steel sword: vault chest in Open Sesame!. Venomous silver sword: Whatsoever a Man Soweth, only if you side with Olgierd.",
   gm:["No set bonus."], levelNote:"Level 39 comes from a single source.",
   v:"unverified", src:["witcherhour","vulkk"]}
];
const GEAR_TIERS = ["basic","enhanced","superior","mastercrafted","grandmaster","single"];
const CRAFTSMEN_RULES = [
  "Each tier needs the previous tier's crafted item as an ingredient. Do not sell or dismantle it.",
  "Basic: any journeyman armorer or blacksmith.",
  "Enhanced and superior: craftsman tier not confirmed in our sources (commonly journeyman, then master).",
  "Mastercrafted: a master. Yoana (armor) or Eibhear Hattori (swords).",
  "Grandmaster: Lazare Lafargue in Toussaint, the only grandmaster smith (Blood and Wine).",
  "Grandmaster set bonuses: 3 pieces for the first bonus, 6 for the second. The crossbow does not count."
];
const WEAPONS = [
  {id:"w-aerondight", name:"Aerondight", kind:"Silver sword", rarity:"Relic", dlc:"baw", how:"Reward from There Can Be Only One (the Hermit at Lac Celavy).", v:"guide", src:["vulkk"]},
  {id:"w-iris", name:"Iris", kind:"Steel sword", rarity:"Relic", dlc:"hos", how:"From Olgierd after you defeat Gaunter O'Dimm in Whatsoever a Man Soweth. Missable.", v:"guide", src:["vulkk"]},
  {id:"w-winter", name:"Winter's Blade", kind:"Steel sword", rarity:"Relic", dlc:null, how:"Given by Crach an Craite before the Battle of Kaer Morhen. Scales with level since 4.0.", v:"guide", src:["fandom","fandomNG"]},
  {id:"w-deithwen", name:"Deithwen", kind:"Silver sword", rarity:"Relic", dlc:null, how:"Several reported sources: the Sunken Chest treasure, In Wolf's Clothing, Contract: The White Lady.", v:"unverified", src:["fextra"]},
  {id:"w-unicorn", name:"Black Unicorn", kind:"Steel sword", rarity:"Relic", dlc:null, how:"Possible Kernun drop, or guarded treasure north-west of the Inn at the Crossroads.", v:"unverified", src:["fextra"]},
  {id:"w-moonblade", name:"Moonblade", kind:"Silver sword", rarity:"Relic", dlc:null, how:"Underwater Spoils of War chest in the Pontar, south-west of Mulbrydale.", v:"guide", src:["fextra"]},
  {id:"w-toussaintknight", name:"Toussaint Knight's Steel Sword", kind:"Steel sword", rarity:"Crafted", dlc:"baw", how:"Diagram in the central tower of the Arthach Palace ruins.", v:"guide", src:["fextra"]},
  {id:"x-ursine", name:"Ursine Crossbow", kind:"Crossbow", rarity:"Witcher", dlc:null, how:"Crafted from its diagram (Spikeroog cave, Bear hunt). Does not count toward set bonuses.", v:"guide", src:["vulkk","fextra"]},
  {id:"x-relic", name:"Crossbow (Relic)", kind:"Crossbow", rarity:"Relic", dlc:null, how:"Sold by Eibhear Hattori in Novigrad.", v:"guide", src:["fextra"]},
  {id:"x-ofieri", name:"Ofieri Crossbow (Relic)", kind:"Crossbow", rarity:"Relic", dlc:"hos", how:"Vault during Open Sesame!. Missable. A Master version is sold by the Ofieri merchant at Upper Mill.", v:"guide", src:["fextra"]},
  {id:"x-toussaint", name:"Toussaint Crossbow", kind:"Crossbow", rarity:"Magic", dlc:"baw", how:"Sold by the Tourney Grounds and Arthach Palace ruins blacksmiths.", v:"guide", src:["fextra"]},
  {id:"x-geralt", name:"Geralt of Rivia's Crossbow", kind:"Crossbow", rarity:"Unique", dlc:"baw", how:"Archery contest prize from Vivienne in The Warble of a Smitten Knight. Missable.", v:"guide", src:["fextra"]}
];

/* ---------- Bestiary ---------- */
const CATS = ["Beasts","Cursed Ones","Draconids","Elementa","Hybrids","Insectoids","Necrophages","Ogroids","Relicts","Specters","Vampires"];
const M = (id, name, cat, o) => Object.assign({id, name, cat, signs:[], bombs:[], potions:[], oil:null, regions:[], tip:null, loot:null, dlc:null, v:"guide", src:["fextraMon"]}, o);
const MONSTERS = [
  M("bear","Bear","Beasts",{signs:["Quen"],oil:"Beast Oil"}),
  M("wolf","Wolf","Beasts",{oil:"Beast Oil"}),
  M("boar","Wild Boar","Beasts",{signs:["Yrden","Igni"],bombs:["Northern Wind"],oil:"Beast Oil"}),
  M("werewolf","Werewolf","Cursed Ones",{signs:["Igni"],bombs:["Moon Dust","Devil's Puffball"],oil:"Cursed Oil"}),
  M("botchling","Botchling","Cursed Ones",{signs:["Axii"],oil:"Cursed Oil"}),
  M("archespore","Archespore","Cursed Ones",{signs:["Aard","Igni"],oil:"Cursed Oil",regions:["toussaint"],dlc:"baw",tip:"Crossbow is effective."}),
  M("wyvern","Wyvern","Draconids",{signs:["Aard"],potions:["Golden Oriole"],bombs:["Grapeshot"],oil:"Draconid Oil"}),
  M("forktail","Forktail","Draconids",{signs:["Aard"],potions:["Golden Oriole"],bombs:["Grapeshot"],oil:"Draconid Oil"}),
  M("basilisk","Basilisk","Draconids",{signs:["Aard"],potions:["Golden Oriole"],bombs:["Grapeshot"],oil:"Draconid Oil",tip:"Crossbow is effective."}),
  M("cockatrice","Cockatrice","Draconids",{signs:["Aard"],bombs:["Grapeshot"],oil:"Draconid Oil",tip:"Crossbow is effective."}),
  M("earth-elemental","Earth Elemental","Elementa",{bombs:["Dimeritium Bomb"],oil:"Elementa Oil"}),
  M("golem","Golem","Elementa",{bombs:["Dimeritium Bomb"],oil:"Elementa Oil"}),
  M("griffin","Griffin","Hybrids",{signs:["Aard"],bombs:["Grapeshot"],oil:"Hybrid Oil",regions:["white-orchard"],tip:"Quen helps while it is airborne. Watch for wing swipes, dives and slams.",loot:"Griffin trophy, Griffin mutagen"}),
  M("harpy","Harpy","Hybrids",{signs:["Aard"],bombs:["Grapeshot"],oil:"Hybrid Oil"}),
  M("arachas","Arachas","Insectoids",{potions:["Golden Oriole"],oil:"Insectoid Oil"}),
  M("endrega","Endrega","Insectoids",{potions:["Golden Oriole"],oil:"Insectoid Oil"}),
  M("kikimore","Kikimore","Insectoids",{signs:["Igni"],potions:["White Honey"],oil:"Insectoid Oil",regions:["toussaint"],dlc:"baw"}),
  M("arachnomorph","Arachnomorph","Insectoids",{signs:["Axii"],oil:"Insectoid Oil",dlc:"hos",tip:"Fast; its web paralyzes. In groups, turn on the one circling behind you.",v:"unverified"}),
  M("drowner","Drowner","Necrophages",{signs:["Igni"],oil:"Necrophage Oil"}),
  M("alghoul","Alghoul","Necrophages",{signs:["Axii"],oil:"Necrophage Oil"}),
  M("rotfiend","Rotfiend","Necrophages",{oil:"Necrophage Oil"}),
  M("water-hag","Water Hag","Necrophages",{signs:["Quen"],bombs:["Northern Wind"],oil:"Necrophage Oil",tip:"Our source lists a second sign with a typo (probably Igni). Unconfirmed."}),
  M("foglet","Foglet","Necrophages",{signs:["Quen"],bombs:["Moon Dust"],oil:"Necrophage Oil"}),
  M("wight","Wight","Necrophages",{signs:["Quen","Igni"],bombs:["Northern Wind"],oil:"Necrophage Oil",regions:["toussaint"],dlc:"baw"}),
  M("nekker","Nekker","Ogroids",{bombs:["Northern Wind"],oil:"Ogroid Oil"}),
  M("troll","Troll (Ice and Rock)","Ogroids",{signs:["Quen"],oil:"Ogroid Oil"}),
  M("cyclops","Cyclops","Ogroids",{signs:["Quen","Axii"],oil:"Ogroid Oil"}),
  M("ice-giant","Ice Giant","Ogroids",{signs:["Quen"],oil:"Ogroid Oil",regions:["skellige"]}),
  M("leshen","Leshen","Relicts",{signs:["Igni"],bombs:["Dimeritium Bomb"],oil:"Relict Oil",regions:["velen","skellige","kaer-morhen"],tip:"Stay out of the straight line in front of it. It teleports as crows; strike its back.",loot:"Leshen mutagen, Leshen resin"}),
  M("fiend","Fiend","Relicts",{bombs:["Devil's Puffball","Samum"],oil:"Relict Oil"}),
  M("chort","Chort","Relicts",{bombs:["Devil's Puffball"],oil:"Relict Oil"}),
  M("shaelmaar","Shaelmaar","Relicts",{signs:["Aard"],bombs:["Samum"],oil:"Relict Oil",regions:["toussaint"],dlc:"baw"}),
  M("noonwraith","Noonwraith","Specters",{signs:["Yrden"],bombs:["Moon Dust"],oil:"Specter Oil",regions:["velen","white-orchard"],tip:"Fight inside Yrden. When it splits into three, hit each copy. Aard and Igni do little.",loot:"Noonwraith mutagen, Light Essence, Specter Dust"}),
  M("nightwraith","Nightwraith","Specters",{signs:["Yrden"],bombs:["Moon Dust"],oil:"Specter Oil"}),
  M("wraith","Wraith","Specters",{signs:["Yrden","Quen"],bombs:["Moon Dust"],oil:"Specter Oil"}),
  M("penitent","Penitent","Specters",{signs:["Yrden","Quen"],bombs:["Moon Dust"],oil:"Specter Oil"}),
  M("barghest","Barghest","Specters",{signs:["Axii","Yrden"],bombs:["Moon Dust"],oil:"Specter Oil",regions:["toussaint"],dlc:"baw"}),
  M("katakan","Katakan","Vampires",{signs:["Yrden","Igni"],bombs:["Moon Dust","Devil's Puffball"],oil:"Vampire Oil"}),
  M("bruxa","Bruxa","Vampires",{signs:["Yrden"],potions:["Black Blood"],bombs:["Moon Dust"],oil:"Vampire Oil",regions:["toussaint"],dlc:"baw",tip:"Turns invisible and strikes from behind. Drink Black Blood first. Its scream can knock you down."}),
  M("alp","Alp","Vampires",{signs:["Yrden"],potions:["Black Blood"],bombs:["Moon Dust"],oil:"Vampire Oil",regions:["toussaint"],dlc:"baw"}),
  M("garkain","Garkain","Vampires",{potions:["Black Blood"],bombs:["Samum","Moon Dust"],oil:"Vampire Oil",regions:["toussaint"],dlc:"baw"}),
  M("fleder","Fleder","Vampires",{potions:["Black Blood"],oil:"Vampire Oil",regions:["toussaint"],dlc:"baw"})
];

/* ---------- Alchemy ---------- */
const A = (id, kind, name, ings, o = {}) => Object.assign({id, kind, name, ings, effect:null, where:null, flag:null, v:"guide", src:["fextraAlc"]}, o);
const DS = ["Dwarven Spirit",1];
const ALCHEMY = [
  A("p-swallow","potion","Swallow",[DS,["Celandine",5],["Drowner Brain",1]],{effect:"Vitality regeneration.",where:"Known on arrival in White Orchard."}),
  A("p-thunder","potion","Thunderbolt",[DS,["Cortinarius",2],["Endrega Embryo",1]],{effect:"Increased attack power.",where:"Given by Vesemir during The Beast of White Orchard."}),
  A("p-cat","potion","Cat",[DS,["Berbercane Fruit",4],["Water Essence",2]],{effect:"See in the dark.",where:"Known on arrival in White Orchard."}),
  A("p-owl","potion","Tawny Owl",[DS,["Verbena",2],["Arachas Venom",1]],{effect:"Stamina regeneration in combat.",where:"Chests; alchemists and herbalists."}),
  A("p-honey","potion","White Honey",[DS,["Honeysuckle",1]],{effect:"Removes active potion effects and Toxicity.",where:"Known on arrival in White Orchard."}),
  A("p-moon","potion","Full Moon",[DS,["Wolfsbane",2],["Dark Essence",1]],{effect:"Raises max Vitality.",where:"Otto Bamber may stock it."}),
  A("p-blizzard","potion","Blizzard",[DS,["White Myrtle Petals",5],["Golem's Heart",1]],{effect:"Slows time after a kill.",where:"White Orchard roadside-shrine herbalist may stock it."}),
  A("p-oriole","potion","Golden Oriole",[DS,["Blowball",4],["Light Essence",1]],{effect:"Poison immunity and cure."}),
  A("p-maribor","potion","Maribor Forest",[DS,["Berbercane Fruit",3],["Alghoul Bone Marrow",1],["Drowner Tongue",4]],{effect:"More adrenaline gain.",where:"Otto Bamber, or Yolar on Ard Skellig."}),
  A("p-whale","potion","Killer Whale",[["Dwarven Spirit",2],["Balisse Fruit",5],["Buckthorn",6],["Drowner Tongue",5]],{effect:"Underwater breathing and vision.",where:"Otto Bamber.",flag:"Quantities look high; needs a second source.",v:"unverified"}),
  A("p-blackblood","potion","Black Blood",[DS,["Sewant Mushrooms",2],["Ghoul's Blood",4]],{effect:"Damages vampires and necrophages that bite you."}),
  A("p-petri","potion","Petri's Philter",[DS,["Arenaria",5],["Specter Dust",1]],{effect:"Raises Sign intensity.",where:"Otto Bamber or the Glory Lane herbalist."}),
  A("d-ekimmara","decoction","Ekimmara",[DS,["Ekimmara Mutagen",1],["White Myrtle",1],["Mandrake Root",1]],{effect:"Damage dealt restores Vitality.",where:"Book: My Evening with a Vampire."}),
  A("d-waterhag","decoction","Water Hag",[DS,["Water Hag Mutagen",1],["Berbercane Fruit",1]],{effect:"+50% damage at full Vitality."}),
  A("d-griffin","decoction","Griffin",[DS,["Griffin Mutagen",1],["Oil",1],["Bryonia",1],["Wolf's Liver",1]],{effect:"Resistance builds as you take damage.",where:"May be sold by Bram or Tomira in White Orchard."}),
  A("d-troll","decoction","Troll",[DS,["Troll Mutagen",1],["Crow's Eye",1],["Honeysuckle",1]],{effect:"Vitality regeneration in and out of combat.",where:"Tomira."}),
  A("d-werewolf","decoction","Werewolf",[DS,["Werewolf Mutagen",1],["Beggartick Blossoms",1],["Hop Umbels",1]],{effect:"Stamina regeneration on moonlit nights.",where:"Reward for sparing Morkvarg (In Wolf's Clothing)."}),
  A("d-katakan","decoction","Katakan",[DS,["Katakan Mutagen",1],["Verbena",1],["Arenaria",1]],{effect:"+10% critical hit chance."}),
  A("d-alghoul","decoction","Alghoul",[DS,["Lesser Red Mutagen",5],["Alghoul Bone Marrow",1],["Buckthorn",1]],{effect:"Faster adrenaline gain.",where:"Book: Ghouls and Alghouls (Marcus, Hierarch Square).",flag:"The mutagen line may be wrong in our source.",v:"unverified"}),
  A("d-chort","decoction","Chort",[DS,["Chort Mutagen",1],["Puffball",1],["Cortinarius",1]],{effect:"Immune to stagger."}),
  A("o-necro","oil","Necrophage Oil",[["Dog Tallow",1],["Blowball",4]],{effect:"Bonus vs Necrophages.",target:"Necrophages",where:"Known from the start."}),
  A("o-specter","oil","Specter Oil",[["Bear Fat",1],["Arenaria",4]],{effect:"Bonus vs Specters.",target:"Specters",where:"Known from the start."}),
  A("o-beast","oil","Beast Oil",[["Dog Tallow",1],["Wolf's Liver",2]],{effect:"Bonus vs Beasts.",target:"Beasts"}),
  A("o-cursed","oil","Cursed Oil",[["Dog Tallow",1],["Wolfsbane",4]],{effect:"Bonus vs Cursed Ones.",target:"Cursed Ones"}),
  A("o-draconid","oil","Draconid Oil",[["Dog Tallow",1],["Ergot Seeds",4]],{effect:"Bonus vs Draconids.",target:"Draconids"}),
  A("o-elementa","oil","Elementa Oil",[["Dog Tallow",1],["Puffball",4]],{effect:"Bonus vs Elementa.",target:"Elementa"}),
  A("o-hybrid","oil","Hybrid Oil",[["Dog Tallow",1],["White Myrtle",4]],{effect:"Bonus vs Hybrids.",target:"Hybrids"}),
  A("o-insectoid","oil","Insectoid Oil",[["Dog Tallow",1],["Ranogrin",4]],{effect:"Bonus vs Insectoids.",target:"Insectoids"}),
  A("o-ogroid","oil","Ogroid Oil",[["Bear Fat",1],["Ginatia Petals",4]],{effect:"Bonus vs Ogroids.",target:"Ogroids"}),
  A("o-relict","oil","Relict Oil",[["Dog Tallow",1],["Mistletoe",5]],{effect:"Bonus vs Relicts.",target:"Relicts"}),
  A("o-vampire","oil","Vampire Oil",[["Dog Tallow",2],["Ducal Water",4]],{effect:"Bonus vs Vampires.",target:"Vampires"}),
  A("o-hanged","oil","Hanged Man's Venom",[["Dog Tallow",1],["Arenaria",4]],{effect:"Bonus vs humans and nonhumans.",target:"Humans"}),
  A("b-samum","bomb","Samum",[["Saltpeter",1],["Celandine",2]],{effect:"Blinds. Destroys monster nests.",where:"Starting recipe."}),
  A("b-grapeshot","bomb","Grapeshot",[["Saltpeter",2],["Calcium Equum",2]],{effect:"Shrapnel. Destroys monster nests.",where:"Starting recipe."}),
  A("b-star","bomb","Dancing Star",[["Saltpeter",1],["Sulfur",2]],{effect:"Sets enemies burning. Destroys monster nests.",where:"Harpy Feeding Ground (Velen), Novigrad herbalist, Oxenfurt blacksmith."}),
  A("b-puffball","bomb","Devil's Puffball",[["Saltpeter",1],["Sewant Mushrooms",2]],{effect:"Poison cloud.",where:"Herbalist north-east of Oxenfurt."}),
  A("b-dimeritium","bomb","Dimeritium Bomb",[["Saltpeter",5],["Optima Mater",2]],{effect:"Blocks magic.",where:"Novigrad blacksmith, Oxenfurt."}),
  A("b-dream","bomb","Dragon's Dream",[["Saltpeter",1],["Phosphorus",2]],{effect:"Flammable gas cloud.",where:"White Orchard bandit camp, Devil's Pit (Velen)."}),
  A("b-moondust","bomb","Moon Dust",[["Saltpeter",1],["Quicksilver Solution",2]],{effect:"Stops monsters transforming or turning invisible.",where:"Oxenfurt herbalist, Keira Metz, Novigrad herbalist."}),
  A("b-northern","bomb","Northern Wind",[["Saltpeter",1],["Ducal Water",1],["Powdered Pearl",1],["Allspice",2]],{effect:"Freezes enemies.",where:"Keira Metz, Pellar, Otto Bamber.",flag:"Recipe looks unusual; needs a second source.",v:"unverified"})
];
const INGREDIENTS = [
  {name:"Celandine", where:"Forests in White Orchard, Velen, Novigrad, Skellige and Kaer Morhen."},
  {name:"Arenaria", where:"Sunny open areas in White Orchard, Novigrad, Skellige and Kaer Morhen."},
  {name:"Balisse Fruit", where:"White Orchard, Novigrad, Skellige and Kaer Morhen."},
  {name:"Wolfsbane", where:"White Orchard, Velen, Novigrad, Skellige and fields near Kaer Morhen."},
  {name:"Mandrake Root", where:"Novigrad, Skellige and Kaer Morhen; sold at a herbalist's hut."},
  {name:"Dwarven Spirit", where:"Looted from bodies and containers. Craftable: Empty Bottle, Mahakaman Spirit x2, White Myrtle."},
  {name:"Alcohest", where:"Looted in abundance. Craftable from Empty Bottle, Cherry Cordial, Nilfgaardian Lemon and Balisse Fruit."}
];

/* ---------- Gwent ---------- */
const FACTIONS = {
  nr:{name:"Northern Realms", ability:"Draw an extra card when you win a round."},
  nilf:{name:"Nilfgaardian Empire", ability:"Wins any round that ends in a draw."},
  st:{name:"Scoia'tael", ability:"Decides who takes the first turn."},
  mon:{name:"Monsters", ability:"One random unit card stays on the board after each round."},
  sk:{name:"Skellige", ability:"At the start of round 3, two random graveyard cards return to the battlefield. Added by Blood and Wine."},
  neutral:{name:"Neutral", ability:"Usable in any faction deck."}
};
/* Full card list: every faction deck, neutral, special, weather and leader card, read from the Witcher
   fandom wiki deck pages (rendered tables). Rows come from the row icon; copies are counted from the source text.
   img: path of the card-face image on the wiki CDN (static.wikia.nocookie.net/witcher/images/<img>). */
const GWENT_CARDS = [{"id": "g-nr-ballista", "name": "Ballista", "faction": "nr", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "f/fd/Tw3_gwent_card_face_Ballista.png"}, {"id": "g-nr-blue-stripes-commando", "name": "Blue Stripes Commando", "faction": "nr", "type": "unit", "row": "close", "str": 4, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Elsa or Bram in White Orchard; 1 purchased from Crow's Perch's quartermaster; 1 purchased from Midcopse's merchant", "copies": 3, "img": "e/ee/Tw3_gwent_card_face_Blue_Stripes_Commando_1.png"}, {"id": "g-nr-catapult", "name": "Catapult", "faction": "nr", "type": "unit", "row": "siege", "str": 8, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Elsa or Bram in White Orchard; 1 purchased from Marquise Serenity at the Passiflora; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 3, "img": "8/84/Tw3_gwent_card_face_Catapult_1.png"}, {"id": "g-nr-crinfrid-reavers-dragon-hunter", "name": "Crinfrid Reavers Dragon Hunter", "faction": "nr", "type": "unit", "row": "ranged", "str": 5, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Elsa or Bram in White Orchard; 1 purchased from Claywich's merchant; 1 purchased from Midcopse's merchant", "copies": 3, "img": "7/7c/Tw3_gwent_card_face_Crinfrid_Reavers_Dragon_Hunter.png"}, {"id": "g-nr-dethmold", "name": "Dethmold", "faction": "nr", "type": "unit", "row": "ranged", "str": 6, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "4/4a/Tw3_gwent_card_face_Dethmold.png"}, {"id": "g-nr-dun-banner-medic", "name": "Dun Banner Medic", "faction": "nr", "type": "unit", "row": "siege", "str": 5, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "Part of the base deck", "copies": 1, "img": "f/fe/Tw3_gwent_card_face_Dun_Banner_Medic.png"}, {"id": "g-nr-esterad-thyssen", "name": "Esterad Thyssen", "faction": "nr", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Sigismund Dijkstra during Gwent: Big City Players", "copies": 1, "img": "7/7d/Tw3_gwent_card_face_Esterad_Thyssen.png"}, {"id": "g-nr-foltest-king-of-temeria", "name": "Foltest: King of Temeria", "faction": "nr", "type": "leader", "ability": "Pick an Impenetrable Fog card from your deck and play it instantly.", "acquire": "Part of the base deck", "copies": 1, "img": "b/ba/Tw3_gwent_card_face_Foltest_King_of_Temeria.png"}, {"id": "g-nr-foltest-lord-commander-of-the-north", "name": "Foltest: Lord Commander of the North", "faction": "nr", "type": "leader", "ability": "Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.", "acquire": "Purchased from Elsa or Bram in White Orchard", "copies": 1, "img": "7/7e/Tw3_gwent_card_face_Foltest_Lord_Commander_of_the_North.png"}, {"id": "g-nr-foltest-son-of-medell", "name": "Foltest: Son of Medell", "faction": "nr", "type": "leader", "ability": "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.", "acquire": "Purchased from the merchant at the circus camp near Carsten", "copies": 1, "img": "2/24/Tw3_gwent_card_face_Foltest_Son_of_Medell.png"}, {"id": "g-nr-foltest-the-siegemaster", "name": "Foltest: The Siegemaster", "faction": "nr", "type": "leader", "ability": "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).", "acquire": "Won from the Nilfgaardian nobleman in Vizima", "copies": 1, "img": "8/80/Tw3_gwent_card_face_Foltest_the_Siegemaster.png"}, {"id": "g-nr-foltest-the-steel-forged", "name": "Foltest: The Steel-Forged", "faction": "nr", "type": "leader", "ability": "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.", "acquire": "Won during High Stakes", "copies": 1, "img": "a/ae/Tw3_gwent_card_face_Foltest_the_Steel-Forged.png"}, {"id": "g-nr-john-natalis", "name": "John Natalis", "faction": "nr", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "A Dangerous Game or Prison Warden during The Great Escape", "copies": 1, "img": "2/28/Tw3_gwent_card_face_John_Natalis.png"}, {"id": "g-nr-kaedweni-siege-expert", "name": "Kaedweni Siege Expert", "faction": "nr", "type": "unit", "row": "siege", "str": 1, "ability": "Morale boost: Adds +1 to all units in the row (excluding itself).", "acquire": "Part of the base deck", "copies": 1, "img": "3/38/Tw3_gwent_card_face_Kaedweni_Siege_Expert_1.png"}, {"id": "g-nr-keira-metz", "name": "Keira Metz", "faction": "nr", "type": "unit", "row": "ranged", "str": 5, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "1/14/Tw3_gwent_card_face_Keira_Metz.png"}, {"id": "g-nr-philippa-eilhart", "name": "Philippa Eilhart", "faction": "nr", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Random reward from gwent players", "copies": 1, "img": "b/bf/Tw3_gwent_card_face_Philippa_Eilhart.png"}, {"id": "g-nr-poor-fucking-infantry", "name": "Poor Fucking Infantry", "faction": "nr", "type": "unit", "row": "close", "str": 1, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 part of the base deck; 1 purchased from Lindenvale's merchant; 1 purchased from Midcopse's merchant", "copies": 3, "img": "1/16/Tw3_gwent_card_face_Poor_Fucking_Infantry.png"}, {"id": "g-nr-prince-stennis", "name": "Prince Stennis", "faction": "nr", "type": "unit", "row": "close", "str": 5, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.", "acquire": "Part of the base deck", "copies": 1, "img": "4/4f/Tw3_gwent_card_face_Prince_Stennis.png"}, {"id": "g-nr-redanian-foot-soldier", "name": "Redanian Foot Soldier", "faction": "nr", "type": "unit", "row": "close", "str": 1, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "3/3d/Tw3_gwent_card_face_Redanian_Foot_Soldier_1.png"}, {"id": "g-nr-sabrina-glevissig", "name": "Sabrina Glevissig", "faction": "nr", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "7/76/Tw3_gwent_card_face_Sabrina_Glevissig.png"}, {"id": "g-nr-sheldon-skaggs", "name": "Sheldon Skaggs", "faction": "nr", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "a/ac/Tw3_gwent_card_face_Sheldon_Skaggs.png"}, {"id": "g-nr-siege-tower", "name": "Siege Tower", "faction": "nr", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "f/fd/Tw3_gwent_card_face_Siege_Tower.png"}, {"id": "g-nr-siegfried-of-denesle", "name": "Siegfried of Denesle", "faction": "nr", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "6/6e/Tw3_gwent_card_face_Siegfried_of_Denesle.png"}, {"id": "g-nr-sigismund-dijkstra", "name": "Sigismund Dijkstra", "faction": "nr", "type": "unit", "row": "close", "str": 4, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.", "acquire": "Phillip Strenger during Gwent: Velen Players", "copies": 1, "img": "7/7b/Tw3_gwent_card_face_Sigismund_Dijkstra.png"}, {"id": "g-nr-sile-de-tansarville", "name": "Síle de Tansarville", "faction": "nr", "type": "unit", "row": "ranged", "str": 5, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "c/c7/Tw3_gwent_card_face_Sile_de_Tansarville.png"}, {"id": "g-nr-thaler", "name": "Thaler", "faction": "nr", "type": "unit", "row": "siege", "str": 1, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.", "acquire": "Purchased from Arinbjorn's innkeep", "copies": 1, "img": "9/90/Tw3_gwent_card_face_Thaler.png"}, {"id": "g-nr-trebuchet", "name": "Trebuchet", "faction": "nr", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "7/73/Tw3_gwent_card_face_Trebuchet_1.png"}, {"id": "g-nr-vernon-roche", "name": "Vernon Roche", "faction": "nr", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Haddy during Gwent: Velen Players", "copies": 1, "img": "8/8a/Tw3_gwent_card_face_Vernon_Roche.png"}, {"id": "g-nr-ves", "name": "Ves", "faction": "nr", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "6/67/Tw3_gwent_card_face_Ves.png"}, {"id": "g-nr-yarpen-zigrin", "name": "Yarpen Zigrin", "faction": "nr", "type": "unit", "row": "close", "str": 2, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "8/84/Tw3_gwent_card_face_Yarpen_Zigrin.png"}, {"id": "g-nilf-albrich", "name": "Albrich", "faction": "nilf", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Purchase from Crow's Perch's merchant or Devil's Pit's merchant", "copies": 1, "img": "e/ec/Tw3_gwent_card_face_Albrich.png"}, {"id": "g-nilf-assire-var-anahid", "name": "Assire var Anahid", "faction": "nilf", "type": "unit", "row": "ranged", "str": 6, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "1/19/Tw3_gwent_card_face_Assire_var_Anahid.png"}, {"id": "g-nilf-black-infantry-archer", "name": "Black Infantry Archer", "faction": "nilf", "type": "unit", "row": "ranged", "str": 10, "ability": "None", "acquire": "1 purchased from Claywich's merchant ; 1 purchased from Lindenvale's merchant", "copies": 2, "img": "a/aa/Tw3_gwent_card_face_Black_Infantry_Archer_2.png"}, {"id": "g-nilf-cahir-mawr-dyffryn-aep-ceallach", "name": "Cahir Mawr Dyffryn aep Ceallach", "faction": "nilf", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "1/1f/Tw3_gwent_card_face_Cahir_Mawr_Dyffryn_aep_Ceallach.png"}, {"id": "g-nilf-cynthia", "name": "Cynthia", "faction": "nilf", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Purchased from Crow's Perch's quartermaster", "copies": 1, "img": "5/52/Tw3_gwent_card_face_Cynthia.png"}, {"id": "g-nilf-emhyr-var-emreis-emperor-of-nilfgaard", "name": "Emhyr var Emreis: Emperor of Nilfgaard", "faction": "nilf", "type": "leader", "ability": "Emperor of Nilfgaard: Look at 3 random cards from your opponent's hand.", "acquire": "Purchased from Inn at the Crossroads's innkeep; Purchased from Lindenvale's innkeep", "copies": 2, "img": "1/1c/Tw3_gwent_card_face_Emhyr_var_Emreis_Emperor_of_Nilfgaard.png"}, {"id": "g-nilf-emhyr-var-emreis-his-imperial-majesty", "name": "Emhyr var Emreis: His Imperial Majesty", "faction": "nilf", "type": "leader", "ability": "His Imperial Majesty: Pick a Torrential Rain card from your deck and play it instantly.", "acquire": "Part of the base deck", "copies": 1, "img": "f/fa/Tw3_gwent_card_face_Emhyr_var_Emreis_His_Imperial_Majesty.png"}, {"id": "g-nilf-emhyr-var-emreis-invader-of-the-north", "name": "Emhyr var Emreis: Invader of the North", "faction": "nilf", "type": "leader", "ability": "Invader of the North: Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.", "acquire": "Purchased from the merchant at the circus camp near Carsten", "copies": 1, "img": "c/cb/Tw3_gwent_card_face_Emhyr_var_Emreis_Invader_of_the_North.png"}, {"id": "g-nilf-emhyr-var-emreis-the-relentless", "name": "Emhyr var Emreis: The Relentless", "faction": "nilf", "type": "leader", "ability": "The Relentless: Draw a card from your opponent's discard pile.", "acquire": "Won from Sasha during High Stakes", "copies": 1, "img": "9/9d/Tw3_gwent_card_face_Emhyr_var_Emreis_the_Relentless.png"}, {"id": "g-nilf-emhyr-var-emreis-the-white-flame", "name": "Emhyr var Emreis: The White Flame", "faction": "nilf", "type": "leader", "ability": "The White Flame: Cancel your opponent's Leader Ability.", "acquire": "Won during Gwent: Skellige Style", "copies": 1, "img": "7/77/Tw3_gwent_card_face_Emhyr_var_Emreis_the_White_Flame.png"}, {"id": "g-nilf-etolian-auxiliary-archers", "name": "Etolian Auxiliary Archers", "faction": "nilf", "type": "unit", "row": "ranged", "str": 1, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "1 purchased from Claywich's merchant ; 1 purchased from Lindenvale's merchant", "copies": 2, "img": "6/64/Tw3_gwent_card_face_Etolian_Auxiliary_Archers_1.png"}, {"id": "g-nilf-fringilla-vigo", "name": "Fringilla Vigo", "faction": "nilf", "type": "unit", "row": "ranged", "str": 6, "ability": "None", "acquire": "A Dangerous Game or Prison Warden during The Great Escape", "copies": 1, "img": "8/83/Tw3_gwent_card_face_Fringilla_Vigo.png"}, {"id": "g-nilf-heavy-zerrikanian-fire-scorpion", "name": "Heavy Zerrikanian Fire Scorpion", "faction": "nilf", "type": "unit", "row": "siege", "str": 10, "ability": "None", "acquire": "Purchase from Lindenvale's merchant", "copies": 1, "img": "7/73/Tw3_gwent_card_face_Heavy_Zerrikanian_Fire_Scorpion.png"}, {"id": "g-nilf-impera-brigade-guard", "name": "Impera Brigade Guard", "faction": "nilf", "type": "unit", "row": "close", "str": 3, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Cunny of the Goose's innkeep; 1 purchased from the Seven Cats Inn's innkeep; 1 purchased from Crow's Perch's merchant or Devil's Pit's merchant; 1 purchased from Inn at the Crossroads' innkeep or Lindenvale's innkeep", "copies": 4, "img": "0/04/Tw3_gwent_card_face_Impera_Brigade_Guard_1.png"}, {"id": "g-nilf-letho-of-gulet", "name": "Letho of Gulet", "faction": "nilf", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from the Boatwright during Gwent: Velen Players", "copies": 1, "img": "d/de/Tw3_gwent_card_face_Letho_of_Gulet.png"}, {"id": "g-nilf-menno-coehoorn", "name": "Menno Coehoorn", "faction": "nilf", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.; Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "Won from Inn at the Crossroads' innkeep during Gwent: Playing Innkeeps", "copies": 1, "img": "e/ea/Tw3_gwent_card_face_Menno_Coehoorn.png"}, {"id": "g-nilf-morteisen", "name": "Morteisen", "faction": "nilf", "type": "unit", "row": "close", "str": 3, "ability": "None", "acquire": "Purchased from Midcopse's merchant", "copies": 1, "img": "d/d6/Tw3_gwent_card_face_Morteisen.png"}, {"id": "g-nilf-morvran-voorhis", "name": "Morvran Voorhis", "faction": "nilf", "type": "unit", "hero": true, "row": "siege", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Marquise Serenity during Gwent: Big City Players", "copies": 1, "img": "5/50/Tw3_gwent_card_face_Morvran_Voorhis.png"}, {"id": "g-nilf-nausicaa-cavalry-rider", "name": "Nausicaa Cavalry Rider", "faction": "nilf", "type": "unit", "row": "close", "str": 2, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Crow's Perch's quartermaster; 1 purchased from Crow's Perch's merchant or Devil's Pit's merchant; 1 purchased from Inn at the Crossroads' innkeep or Lindenvale's innkeep", "copies": 3, "img": "c/c5/Tw3_gwent_card_face_Nausicaa_Cavalry_Rider_1.png"}, {"id": "g-nilf-puttkammer", "name": "Puttkammer", "faction": "nilf", "type": "unit", "row": "ranged", "str": 3, "ability": "None", "acquire": "Purchased from Claywich's merchant", "copies": 1, "img": "0/04/Tw3_gwent_card_face_Puttkamer.png"}, {"id": "g-nilf-rainfarn", "name": "Rainfarn", "faction": "nilf", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Purchased from Lindenvale's merchant", "copies": 1, "img": "8/80/Tw3_gwent_card_face_Rainfarn.png"}, {"id": "g-nilf-renuald-aep-matsen", "name": "Renuald aep Matsen", "faction": "nilf", "type": "unit", "row": "ranged", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "d/d8/Tw3_gwent_card_face_Renuald_aep_Matsen.png"}, {"id": "g-nilf-rotten-mangonel", "name": "Rotten Mangonel", "faction": "nilf", "type": "unit", "row": "siege", "str": 3, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "1/18/Tw3_gwent_card_face_Rotten_Mangonel.png"}, {"id": "g-nilf-shilard-fitz-oesterlen", "name": "Shilard Fitz-Oesterlen", "faction": "nilf", "type": "unit", "row": "close", "str": 7, "ability": "Spy: Place on your opponent's battlefield (counts towards your opponent's total) and draw 2 cards from your deck.", "acquire": "Random reward from gwent players", "copies": 1, "img": "6/6f/Tw3_gwent_card_face_Shilard_Fitz-Oesterlen.png"}, {"id": "g-nilf-siege-engineer", "name": "Siege Engineer", "faction": "nilf", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Purchased from Inn at the Crossroads' innkeep; Purchased from Lindenvale's innkeep", "copies": 2, "img": "4/40/Tw3_gwent_card_face_Siege_Engineer.png"}, {"id": "g-nilf-siege-technician", "name": "Siege Technician", "faction": "nilf", "type": "unit", "row": "siege", "str": 0, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "Purchased from The Golden Sturgeon's innkeep; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 2, "img": "3/38/Tw3_gwent_card_face_Siege_Technician.png"}, {"id": "g-nilf-stefan-skellen", "name": "Stefan Skellen", "faction": "nilf", "type": "unit", "row": "close", "str": 9, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.", "acquire": "Random reward from gwent players", "copies": 1, "img": "e/e4/Tw3_gwent_card_face_Stefan_Skellen.png"}, {"id": "g-nilf-sweers", "name": "Sweers", "faction": "nilf", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Purchased from Claywich's merchant", "copies": 1, "img": "2/21/Tw3_gwent_card_face_Sweers.png"}, {"id": "g-nilf-tibor-eggebracht", "name": "Tibor Eggebracht", "faction": "nilf", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Olivier during Gwent: Playing Innkeeps", "copies": 1, "img": "9/93/Tw3_gwent_card_face_Tibor_Eggebracht.png"}, {"id": "g-nilf-vanhemar", "name": "Vanhemar", "faction": "nilf", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "c/ce/Tw3_gwent_card_face_Vanhemar.png"}, {"id": "g-nilf-vattier-de-rideaux", "name": "Vattier de Rideaux", "faction": "nilf", "type": "unit", "row": "close", "str": 4, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.", "acquire": "Random reward from gwent players", "copies": 1, "img": "3/33/Tw3_gwent_card_face_Vattier_de_Rideaux.png"}, {"id": "g-nilf-vreemde", "name": "Vreemde", "faction": "nilf", "type": "unit", "row": "close", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "3/3f/Tw3_gwent_card_face_Vreemde.png"}, {"id": "g-nilf-young-emissary", "name": "Young Emissary", "faction": "nilf", "type": "unit", "row": "close", "str": 5, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 purchased from Cunny of the Goose's innkeep; 1 purchased from the Seven Cats Inn's innkeep", "copies": 2, "img": "8/80/Tw3_gwent_card_face_Young_Emmisary_1.png"}, {"id": "g-nilf-zerrikanian-fire-scorpion", "name": "Zerrikanian Fire Scorpion", "faction": "nilf", "type": "unit", "row": "siege", "str": 5, "ability": "None", "acquire": "Purchase from Crow's Perch's merchant or Devil's Pit's merchant", "copies": 1, "img": "4/41/Tw3_gwent_card_face_Zerrikanian_Fire_Scorpion.png"}, {"id": "g-st-barclay-els", "name": "Barclay Els", "faction": "st", "type": "unit", "row": "agile", "str": 6, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Purchased from the innkeep of The Golden Sturgeon in Novigrad; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten; Blood and Wine expansion: A possible reward during Till Death Do You Part", "copies": 3, "img": "9/9c/Tw3_gwent_card_face_Barclay_Els.png"}, {"id": "g-st-ciaran-aep-easnillien", "name": "Ciaran aep Easnillien", "faction": "st", "type": "unit", "row": "agile", "str": 3, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Random reward from gwent players", "copies": 1, "img": "5/51/Tw3_gwent_card_face_Ciaran_aep_Easnillien.png"}, {"id": "g-st-dennis-cranmer", "name": "Dennis Cranmer", "faction": "st", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "9/94/Tw3_gwent_card_face_Dennis_Cranmer.png"}, {"id": "g-st-dol-blathanna-archer", "name": "Dol Blathanna Archer", "faction": "st", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Purchase from Marquise Serenity at the Passiflora; Hearts of Stone expansion: Purchase from merchant at the circus camp near Carsten; Blood and Wine expansion: Purchase from Hugo Monnart or any innkeeper in Toussaint", "copies": 3, "img": "b/bc/Tw3_gwent_card_face_Dol_Blathanna_Archer.png"}, {"id": "g-st-dol-blathanna-scout", "name": "Dol Blathanna Scout", "faction": "st", "type": "unit", "row": "agile", "str": 6, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "1 purchased from the The Golden Sturgeon's Innkeep; 2 are random rewards from gwent players; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 4, "img": "b/b8/Tw3_gwent_card_face_Dol_Blathanna_Scout_3.png"}, {"id": "g-st-dwarven-skirmisher", "name": "Dwarven Skirmisher", "faction": "st", "type": "unit", "row": "close", "str": 3, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 purchased from Stjepan at The Alchemy; 2 are random rewards from gwent players", "copies": 3, "img": "4/41/Tw3_gwent_card_face_Dwarevn_Skirmisher_1.png"}, {"id": "g-st-eithne", "name": "Eithné", "faction": "st", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Zoltan during Gwent: Old Pals", "copies": 1, "img": "c/ce/Tw3_gwent_card_face_Eithne.png"}, {"id": "g-st-elven-skirmisher", "name": "Elven Skirmisher", "faction": "st", "type": "unit", "row": "ranged", "str": 2, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 purchased from Urialla Harbor's Innkeep; 2 are random rewards from gwent players", "copies": 3, "img": "2/21/Tw3_gwent_card_face_Elven_Skirmisher_3.png"}, {"id": "g-st-filavandrel-aen-fidhail", "name": "Filavandrel aen Fidhail", "faction": "st", "type": "unit", "row": "agile", "str": 6, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Random reward from gwent players", "copies": 1, "img": "0/02/Tw3_gwent_card_face_Filavandrel_aen_Fidhail.png"}, {"id": "g-st-francesca-findabair-daisy-of-the-valley", "name": "Francesca Findabair: Daisy of the Valley", "faction": "st", "type": "leader", "ability": "Daisy of the Valley: Draw an extra card at the beginning of the battle.", "acquire": "Purchased from Cunny of the Goose's Innkeep", "copies": 1, "img": "b/bb/Tw3_gwent_card_face_Francesca_Findabair_Daisy_of_the_Valley.png"}, {"id": "g-st-francesca-findabair-hope-of-the-aen-seidhe", "name": "Francesca Findabair: Hope of the Aen Seidhe", "faction": "st", "type": "leader", "ability": "Hope of the Aen Seidhe: Move agile units to whichever valid row maximizes their strength (don't move units already in optimal row).", "acquire": "Purchase from Dulla kh'Amanni at Upper Mill", "copies": 1, "img": "2/21/Tw3_gwent_card_face_Francesca_Findabair_Hope_of_the_Aen_Seidhe.png"}, {"id": "g-st-francesca-findabair-pureblood-elf", "name": "Francesca Findabair: Pureblood Elf", "faction": "st", "type": "leader", "ability": "Pureblood Elf: Pick a Biting Frost card from your deck and play it instantly.", "acquire": "Part of the base deck", "copies": 1, "img": "1/1b/Tw3_gwent_card_face_Francesca_Findabair_Pureblood_Elf.png"}, {"id": "g-st-francesca-findabair-queen-of-dol-blathanna", "name": "Francesca Findabair: Queen of Dol Blathanna", "faction": "st", "type": "leader", "ability": "Queen of Dol Blathanna: Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more.", "acquire": "Won from Finneas during High Stakes", "copies": 1, "img": "b/b1/Tw3_gwent_card_face_Francesca_Findabair_Queen_of_Dol_Blathanna.png"}, {"id": "g-st-francesca-findabair-the-beautiful", "name": "Francesca Findabair: The Beautiful", "faction": "st", "type": "leader", "ability": "The Beautiful: Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).", "acquire": "Won during Gwent: Big City Players", "copies": 1, "img": "f/f1/Tw3_gwent_card_face_Francesca_Findabair_the_Beautiful.png"}, {"id": "g-st-havekar-healer", "name": "Havekar Healer", "faction": "st", "type": "unit", "row": "ranged", "str": 0, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "1 purchased from The Kingfisher Inn's Innkeep; 1 purchased from the Cunny of the Goose's Innkeep; 1 is a random reward from gwent players; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 4, "img": "5/5c/Tw3_gwent_card_face_Havekar_Healer_3.png"}, {"id": "g-st-havekar-smuggler", "name": "Havekar Smuggler", "faction": "st", "type": "unit", "row": "close", "str": 5, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 purchased from The Kingfisher Inn's Innkeep; 1 purchased from the Seven Cats Inn's Innkeep; 1 is a random reward from gwent players; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 4, "img": "b/ba/Tw3_gwent_card_face_Havekar_Smuggler_3.png"}, {"id": "g-st-ida-emean-aep-sivney", "name": "Ida Emean aep Sivney", "faction": "st", "type": "unit", "row": "ranged", "str": 6, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "8/84/Tw3_gwent_card_face_Ida_Emean_aep_Sivney.png"}, {"id": "g-st-iorveth", "name": "Iorveth", "faction": "st", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Reward for completing Shock Therapy", "copies": 1, "img": "7/78/Tw3_gwent_card_face_Iorveth.png"}, {"id": "g-st-isengrim-faoiltiarna", "name": "Isengrim Faoiltiarna", "faction": "st", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Morale boost: Adds +1 to all units in the row (excluding itself).; Hero: Not affected by any Special Cards or abilities.", "acquire": "A Dangerous Game or Prison Warden during The Great Escape", "copies": 1, "img": "a/a3/Tw3_gwent_card_face_Isengrim_Faoiltiarna.png"}, {"id": "g-st-mahakaman-defender", "name": "Mahakaman Defender", "faction": "st", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "1 purchased from The Kingfisher Inn's Innkeep; 1 purchased from the Seven Cats Inn's Innkeep; 1 purchased from The Golden Sturgeon's Innkeep; 1 purchased from Marquise Serenity at the Passiflora; 1 purchased from Stjepan at The Alchemy; Hearts of Stone expansion: 3 can be purchased from the merchant at the circus camp near Carsten", "copies": 6, "img": "c/cd/Tw3_gwent_card_face_Mahakaman_Defender_1.png"}, {"id": "g-st-milva", "name": "Milva", "faction": "st", "type": "unit", "row": "ranged", "str": 10, "ability": "Morale boost: Adds +1 to all units in the row (excluding itself).", "acquire": "Won during A Matter of Life and Death", "copies": 1, "img": "4/43/Tw3_gwent_card_face_Milva.png"}, {"id": "g-st-riordain", "name": "Riordain", "faction": "st", "type": "unit", "row": "ranged", "str": 1, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "6/6c/Tw3_gwent_card_face_Riordain.png"}, {"id": "g-st-saesenthessis", "name": "Saesenthessis", "faction": "st", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Vernon Roche during Gwent: Old Pals", "copies": 1, "img": "5/56/Tw3_gwent_card_face_Saesenthessis.png"}, {"id": "g-st-schirru", "name": "Schirrú", "faction": "st", "type": "unit", "row": "siege", "str": 8, "ability": "Scorch - Siege: Destroys your enemy's strongest Siege Combat unit(s) if the combined strength of all his or her Siege Combat units is 10 or more.", "acquire": "Won from the merchant at the circus northwest of Carsten", "copies": 1, "img": "4/41/Tw3_gwent_card_face_Schirru.png"}, {"id": "g-st-toruviel", "name": "Toruviel", "faction": "st", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "5/50/Tw3_gwent_card_face_Toruviel.png"}, {"id": "g-st-vrihedd-brigade-recruit", "name": "Vrihedd Brigade Recruit", "faction": "st", "type": "unit", "row": "ranged", "str": 4, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "b/bd/Tw3_gwent_card_face_Vrihedd_Brigade_Recruit.png"}, {"id": "g-st-vrihedd-brigade-veteran", "name": "Vrihedd Brigade Veteran", "faction": "st", "type": "unit", "row": "agile", "str": 5, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "1 purchased from Stjepan at The Alchemy; 1 purchased from The Kingfisher Inn's Innkeep; Hearts of Stone expansion: 1 can be purchased from the merchant at the circus camp near Carsten", "copies": 3, "img": "9/9b/Tw3_gwent_card_face_Vrihedd_Brigade_Veteran_2.png"}, {"id": "g-st-yaevinn", "name": "Yaevinn", "faction": "st", "type": "unit", "row": "agile", "str": 6, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Won from Sjusta during Gwent: Skellige Style", "copies": 1, "img": "f/fa/Tw3_gwent_card_face_Yaevinn.png"}, {"id": "g-mon-arachas", "name": "Arachas", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 purchased from Arinbjorn's innkeep; 1 purchased from Urialla Harbor's innkeep; 1 purchased from Svorlag's innkeep", "copies": 3, "img": "2/2d/Tw3_gwent_card_face_Arachas_1.png"}, {"id": "g-mon-arachas-behemoth", "name": "Arachas Behemoth", "faction": "mon", "type": "unit", "row": "siege", "str": 6, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Random reward from gwent players", "copies": 1, "img": "8/8e/Tw3_gwent_card_face_Arachas_Behemoth.png"}, {"id": "g-mon-botchling", "name": "Botchling", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Purchased from Jonas at The New Port", "copies": 1, "img": "6/6c/Tw3_gwent_card_face_Botchling.png"}, {"id": "g-mon-celaeno-harpy", "name": "Celaeno Harpy", "faction": "mon", "type": "unit", "row": "agile", "str": 2, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Random reward from gwent players", "copies": 1, "img": "1/16/Tw3_gwent_card_face_Celaeno_Harpy.png"}, {"id": "g-mon-cockatrice", "name": "Cockatrice", "faction": "mon", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "c/c9/Tw3_gwent_card_face_Cockatrice.png"}, {"id": "g-mon-crone-brewess", "name": "Crone: Brewess", "faction": "mon", "type": "unit", "row": "close", "str": 6, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Random reward from gwent players", "copies": 1, "img": "a/ad/Tw3_gwent_card_face_Crone_Brewess.png"}, {"id": "g-mon-crone-weavess", "name": "Crone: Weavess", "faction": "mon", "type": "unit", "row": "close", "str": 6, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Won from the Old Sage during Gwent: Velen Players", "copies": 1, "img": "2/29/Tw3_gwent_card_face_Crone_Weavess.png"}, {"id": "g-mon-crone-whispess", "name": "Crone: Whispess", "faction": "mon", "type": "unit", "row": "close", "str": 6, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Purchased from Arinbjorn's innkeep", "copies": 1, "img": "2/2c/Tw3_gwent_card_crone_Whispess.png"}, {"id": "g-mon-draug", "name": "Draug", "faction": "mon", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Crach an Craite during Gwent: Skellige Style", "copies": 1, "img": "4/40/Tw3_gwent_card_face_Draug.png"}, {"id": "g-mon-earth-elemental", "name": "Earth Elemental", "faction": "mon", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Purchased from Jonas at The New Port", "copies": 1, "img": "3/3f/Tw3_gwent_card_face_Earth_Elemental.png"}, {"id": "g-mon-endrega", "name": "Endrega", "faction": "mon", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "b/b5/Tw3_gwent_card_face_Endrega.png"}, {"id": "g-mon-eredin-breacc-glas-the-treacherous", "name": "Eredin Bréacc Glas: The Treacherous", "faction": "mon", "type": "leader", "ability": "Doubles the strength of all spy cards (affects both players).", "acquire": "Purchase from Dulla kh'Amanni in Upper Mill", "copies": 1, "img": "8/8b/Tw3_gwent_card_face_Eredin_The_Treacherous.png"}, {"id": "g-mon-eredin-bringer-of-death", "name": "Eredin: Bringer of Death", "faction": "mon", "type": "leader", "ability": "Restore a card from your discard pile to your hand.", "acquire": "Won from Count Tybalt during High Stakes", "copies": 1, "img": "f/fd/Tw3_gwent_card_face_Eredin_Bringer_of_Death.png"}, {"id": "g-mon-eredin-commander-of-the-red-riders", "name": "Eredin: Commander of the Red Riders", "faction": "mon", "type": "leader", "ability": "Double the strength of all your Close Combat units (unless a Commander's horn is also present on that row).", "acquire": "Purchased from Jonas at The New Port", "copies": 1, "img": "4/43/Tw3_gwent_card_face_Eredin_Commander_of_the_Red_Riders.png"}, {"id": "g-mon-eredin-destroyer-of-worlds", "name": "Eredin: Destroyer of Worlds", "faction": "mon", "type": "leader", "ability": "Discard 2 card and draw 1 card of your choice from your deck.", "acquire": "Won during Gwent: Velen Players", "copies": 1, "img": "1/17/Tw3_gwent_card_face_Eredin_Destroyer_of_Worlds.png"}, {"id": "g-mon-eredin-king-of-the-wild-hunt", "name": "Eredin: King of the Wild Hunt", "faction": "mon", "type": "leader", "ability": "Pick any weather card from your deck and play it instantly.", "acquire": "Part of the base deck", "copies": 1, "img": "b/b6/Tw3_gwent_card_face_Eredin_King_of_the_Wild_Hunt.png"}, {"id": "g-mon-fiend", "name": "Fiend", "faction": "mon", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Purchased from Arinbjorn's innkeep", "copies": 1, "img": "5/52/Tw3_gwent_card_face_Fiend.png"}, {"id": "g-mon-fire-elemental", "name": "Fire Elemental", "faction": "mon", "type": "unit", "row": "siege", "str": 6, "ability": "None", "acquire": "Random reward from gwent players; Possible loot in house at Hindar", "copies": 2, "img": "a/ae/Tw3_gwent_card_face_Fire_Elemental.png"}, {"id": "g-mon-foglet", "name": "Foglet", "faction": "mon", "type": "unit", "row": "close", "str": 2, "ability": "None", "acquire": "Purchased from Svorlag's innkeep", "copies": 1, "img": "2/21/Tw3_gwent_card_face_Foglet.png"}, {"id": "g-mon-forktail", "name": "Forktail", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "b/bf/Tw3_gwent_card_face_Forktail.png"}, {"id": "g-mon-frightener", "name": "Frightener", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "f/f8/Tw3_gwent_card_face_Frightener.png"}, {"id": "g-mon-gargoyle", "name": "Gargoyle", "faction": "mon", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "6/6e/Tw3_gwent_card_face_Gargoyle.png"}, {"id": "g-mon-ghoul", "name": "Ghoul", "faction": "mon", "type": "unit", "row": "close", "str": 1, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "2 are random rewards from gwent players; 1 purchased from Harviken's innkeep", "copies": 3, "img": "7/76/Tw3_gwent_card_face_Ghoul_3.png"}, {"id": "g-mon-grave-hag", "name": "Grave Hag", "faction": "mon", "type": "unit", "row": "ranged", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "6/64/Tw3_gwent_card_face_Grave_Hag.png"}, {"id": "g-mon-griffin", "name": "Griffin", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "6/61/Tw3_gwent_card_face_Griffin.png"}, {"id": "g-mon-harpy", "name": "Harpy", "faction": "mon", "type": "unit", "row": "agile", "str": 2, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Purchased from Harviken's innkeep", "copies": 1, "img": "e/e1/Tw3_gwent_card_face_Harpy.png"}, {"id": "g-mon-ice-giant", "name": "Ice Giant", "faction": "mon", "type": "unit", "row": "siege", "str": 5, "ability": "None", "acquire": "Purchased from Svorlag's innkeep", "copies": 1, "img": "f/f1/Tw3_gwent_card_face_Ice_Giant.png"}, {"id": "g-mon-imlerith", "name": "Imlerith", "faction": "mon", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Random reward from gwent players", "copies": 1, "img": "3/3b/Tw3_gwent_card_face_Imlerith.png"}, {"id": "g-mon-kayran", "name": "Kayran", "faction": "mon", "type": "unit", "hero": true, "row": "agile", "str": 8, "ability": "Hero: Not affected by any Special Cards or abilities.; Morale boost: Adds +1 to all units in the row (excluding itself).; Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Random reward from gwent players", "copies": 1, "img": "4/48/Tw3_gwent_card_face_Kayran.png"}, {"id": "g-mon-leshen", "name": "Leshen", "faction": "mon", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Ermion during Gwent: Skellige Style", "copies": 1, "img": "8/86/Tw3_gwent_card_face_Leshen.png"}, {"id": "g-mon-nekker", "name": "Nekker", "faction": "mon", "type": "unit", "row": "close", "str": 2, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 obtained during Following the Thread off Hammond's corpse; 1 purchased from Harviken's innkeep; 1 as random reward from gwent players", "copies": 3, "img": "b/be/Tw3_gwent_card_face_Nekker_1.png"}, {"id": "g-mon-plague-maiden", "name": "Plague Maiden", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "f/fd/Tw3_gwent_card_face_Plague_Maiden.png"}, {"id": "g-mon-toad", "name": "Toad", "faction": "mon", "type": "unit", "row": "ranged", "str": 7, "ability": "Scorch - Ranged: Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.", "acquire": "Won from Olgierd von Everec", "copies": 1, "img": "1/1f/Tw3_gwent_card_face_Toad.png"}, {"id": "g-mon-vampire-bruxa", "name": "Vampire: Bruxa", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly", "acquire": "Won during A Matter of Life and Death; Blood and Wine expansion: Rewarded for removing Louis' urn in Till Death Do You Part", "copies": 2, "img": "e/e2/Tw3_gwent_card_face_Vampire_Bruxa.png"}, {"id": "g-mon-vampire-ekimmara", "name": "Vampire: Ekimmara", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly", "acquire": "Purchased from Svorlag's innkeep", "copies": 1, "img": "a/a8/Tw3_gwent_card_face_Vampire_Ekimmara.png"}, {"id": "g-mon-vampire-fleder", "name": "Vampire: Fleder", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly", "acquire": "Purchased from Harviken's innkeep", "copies": 1, "img": "2/23/Tw3_gwent_card_face_Vampire_Fleder.png"}, {"id": "g-mon-vampire-garkain", "name": "Vampire: Garkain", "faction": "mon", "type": "unit", "row": "close", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly", "acquire": "Random reward from gwent players", "copies": 1, "img": "2/2d/Tw3_gwent_card_face_Vampire_Garkain.png"}, {"id": "g-mon-vampire-katakan", "name": "Vampire: Katakan", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Madman Lugos during Gwent: Skellige Style", "copies": 1, "img": "e/e4/Tw3_gwent_card_face_Vampire_Katakan.png"}, {"id": "g-mon-werewolf", "name": "Werewolf", "faction": "mon", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Purchased from Urialla Harbor's innkeep", "copies": 1, "img": "2/25/Tw3_gwent_card_face_Werewolf.png"}, {"id": "g-mon-wyvern", "name": "Wyvern", "faction": "mon", "type": "unit", "row": "ranged", "str": 2, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "3/3b/Tw3_gwent_card_face_Wyvern.png"}, {"id": "g-sk-berserker", "name": "Berserker", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "Transforms into a bear when a Mardroeme card is on its row.", "acquire": "Part of the base deck", "copies": 1, "img": "6/65/Tw3_gwent_face_Berserker.png"}, {"id": "g-sk-birna-bran", "name": "Birna Bran", "faction": "sk", "type": "unit", "row": "close", "str": 2, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).", "acquire": "Part of the base deck", "copies": 1, "img": "2/23/Tw3_gwent_face_Birna_Bran.png"}, {"id": "g-sk-blueboy-lugos", "name": "Blueboy Lugos", "faction": "sk", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "b/bd/Tw3_gwent_face_Blueboy_Lugos.png"}, {"id": "g-sk-cerys", "name": "Cerys", "faction": "sk", "type": "unit", "hero": true, "row": "close", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.; Summon Shield Maidens: Summons all Shield Maidens from deck and hand.", "acquire": "Won from The Barrel and Bung Inn's Innkeep", "copies": 1, "img": "3/3c/Tw3_gwent_card_face_Cerys.png"}, {"id": "g-sk-clan-brokvar-archer", "name": "Clan Brokvar Archer", "faction": "sk", "type": "unit", "row": "ranged", "str": 6, "ability": "None", "acquire": "2 are part of the base deck; 1 won from Castel Ravello Vineyard's herbalist", "copies": 3, "img": "f/f2/Tw3_gwent_face_Clan_Brokvar_Archer.png"}, {"id": "g-sk-clan-dimun-pirate", "name": "Clan Dimun Pirate", "faction": "sk", "type": "unit", "row": "ranged", "str": 6, "ability": "Scorch: Kills the strongest card(s) on the battlefield.", "acquire": "Won from Dupont & Sons' merchant", "copies": 1, "img": "4/4e/Tw3_gwent_card_face_Clan_Dimun_Pirate.png"}, {"id": "g-sk-clan-drummond-shield-maiden", "name": "Clan Drummond Shield Maiden", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "1 is part of the base deck; 1 won from The Cockatrice Inn's innkeep; 1 won from the Francollarts' armorer", "copies": 3, "img": "3/3b/Tw3_gwent_face_Clan_Drummond_Shield_Maiden_2.png"}, {"id": "g-sk-clan-heymaey-skald", "name": "Clan Heymaey Skald", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "9/96/Tw3_gwent_face_Clan_Heymaey_Skald.png"}, {"id": "g-sk-clan-tordarroch-armorsmith", "name": "Clan Tordarroch Armorsmith", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "7/7f/Tw3_gwent_face_Clan_Tordarroch_Armorsmith.png"}, {"id": "g-sk-clan-an-craite-warrior", "name": "Clan an Craite Warrior", "faction": "sk", "type": "unit", "row": "close", "str": 6, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "Part of the base deck", "copies": 1, "img": "0/05/Tw3_gwent_face_Clan_an_Craite_Warrior.png"}, {"id": "g-sk-crach-an-craite", "name": "Crach an Craite", "faction": "sk", "type": "leader", "ability": "Shuffle all cards from each player's graveyard back into their decks.", "acquire": "Part of the base deck", "copies": 1, "img": "d/da/Tw3_gwent_card_face_Crach_an_Craite.png"}, {"id": "g-sk-donar-an-hindar", "name": "Donar an Hindar", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "8/8d/Tw3_gwent_face_Donar_an_Hindar.png"}, {"id": "g-sk-draig-bon-dhu", "name": "Draig Bon-Dhu", "faction": "sk", "type": "unit", "row": "siege", "str": 2, "ability": "Commander's Horn: Doubles the strength of all unit cards in that row. Limited to 1 per row.", "acquire": "Won from The Pheasantry's innkeep", "copies": 1, "img": "b/b5/Tw3_gwent_card_face_Draig_Bon-Dhu.png"}, {"id": "g-sk-ermion", "name": "Ermion", "faction": "sk", "type": "unit", "hero": true, "row": "ranged", "str": 8, "ability": "Hero: Not affected by any Special Cards or abilities.; Mardroeme: Triggers transformation of all Berserker cards on the same row.", "acquire": "Won from Francollarts' innkeep", "copies": 1, "img": "f/f9/Tw3_gwent_card_face_Ermion.png"}, {"id": "g-sk-hemdall", "name": "Hemdall", "faction": "sk", "type": "unit", "hero": true, "row": "close", "str": 11, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Transformed version of Kambi", "copies": 1, "token": "Transformed from Kambi during play; not a separate card to collect.", "img": "1/13/Tw3_gwent_face_Hemdall.png"}, {"id": "g-sk-hjalmar", "name": "Hjalmar", "faction": "sk", "type": "unit", "hero": true, "row": "ranged", "str": 10, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Part of the base deck", "copies": 1, "img": "8/81/Tw3_gwent_face_Hjalmar.png"}, {"id": "g-sk-holger-blackhand", "name": "Holger Blackhand", "faction": "sk", "type": "unit", "row": "siege", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "f/f8/Tw3_gwent_face_Holger_Blackhand.png"}, {"id": "g-sk-kambi", "name": "Kambi", "faction": "sk", "type": "unit", "row": "close", "str": 0, "ability": "When this card is removed from the battlefield, it summons a powerful new Unit Card to take its place.", "acquire": "Won from Hauteville's armorer", "copies": 1, "img": "8/82/Tw3_gwent_card_face_Kambi.png"}, {"id": "g-sk-king-bran", "name": "King Bran", "faction": "sk", "type": "leader", "ability": "Units only lose half their Strength in bad weather conditions.", "acquire": "Won from the Ducal Camerlengo in Beauclair; Completing Gwent: To Everything - Turn, Turn, Tournament!", "copies": 2, "img": "9/9f/Tw3_gwent_face_King_Bran.png"}, {"id": "g-sk-light-longship", "name": "Light Longship", "faction": "sk", "type": "unit", "row": "ranged", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "2 are part of the base deck; 1 won from the Perfumery's merchant", "copies": 3, "img": "5/57/Tw3_gwent_face_Light_Longship.png"}, {"id": "g-sk-madman-lugos", "name": "Madman Lugos", "faction": "sk", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "9/93/Tw3_gwent_face_Madman_Lugos.png"}, {"id": "g-sk-mardroeme", "name": "Mardroeme", "faction": "sk", "type": "special", "ability": "Triggers transformation of all Berserker cards on the same row.", "acquire": "1 is part of the base deck; 1 won from The Belles of Beauclair's madame; 1 won from the Herb Store's herbalist", "copies": 3, "img": "8/8f/Tw3_gwent_card_face_Mardroeme.png"}, {"id": "g-sk-olaf", "name": "Olaf", "faction": "sk", "type": "unit", "row": "agile", "str": 12, "ability": "Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.; Morale boost: Adds +1 to all units in the row (excluding itself).", "acquire": "Won from The Adder and Jewels Winery's sommelier", "copies": 1, "img": "1/13/Tw3_gwent_face_Olaf.png"}, {"id": "g-sk-skellige-storm", "name": "Skellige Storm", "faction": "sk", "type": "weather", "ability": "Reduces the Strength of all Range and Siege Units to 1.", "acquire": "1 is won from the Tourney Grounds' armorer; 1 is won from the Tourney Grounds' barber; 1 is won from Beauclair Port's butcher", "copies": 3, "img": "1/1a/Tw3_gwent_face_Skellige_Storm.png"}, {"id": "g-sk-svanrige", "name": "Svanrige", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "4/4a/Tw3_gwent_face_Svanrige.png"}, {"id": "g-sk-transformed-vildkaarl", "name": "Transformed Vildkaarl", "faction": "sk", "type": "unit", "row": "close", "str": 14, "ability": "Morale boost: Adds +1 strength to all units in the row (excluding itself).", "acquire": "Transformed version of Berserker", "copies": 1, "img": "0/0c/Tw3_gwent_card_face_vildkaarl.png"}, {"id": "g-sk-transformed-young-vildkaarl", "name": "Transformed Young Vildkaarl", "faction": "sk", "type": "unit", "row": "ranged", "str": 8, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "Transformed version of Young Berserker", "copies": 1, "img": "d/dd/Tw3_gwent_card_face_young_vildkaarl.png"}, {"id": "g-sk-udalryk", "name": "Udalryk", "faction": "sk", "type": "unit", "row": "close", "str": 4, "ability": "None", "acquire": "Part of the base deck", "copies": 1, "img": "9/9a/Tw3_gwent_face_Udalryk.png"}, {"id": "g-sk-war-longship", "name": "War Longship", "faction": "sk", "type": "unit", "row": "siege", "str": 6, "ability": "Tight Bond: Place next to a card with the same name to double the strength of both cards.", "acquire": "2 are part of the base deck; 1 won from the Tourney Grounds' innkeep", "copies": 3, "img": "6/63/Tw3_gwent_face_War_Longship.png"}, {"id": "g-sk-young-berserker", "name": "Young Berserker", "faction": "sk", "type": "unit", "row": "ranged", "str": 2, "ability": "Transforms into a bear when a Mardroeme card is on its row.", "acquire": "1 is part of the base deck; 1 won from the Tourney Grounds' blacksmith; 1 won from Pierre at Tailor's Workshop", "copies": 3, "img": "7/77/Tw3_gwent_face_Young_Berserker.png"}, {"id": "g-neutral-biting-frost", "name": "Biting Frost", "faction": "neutral", "type": "weather", "ability": "Sets the strength of all Close Combat cards to 1 for both players.", "acquire": "2 are part of the base deck; 1 is a random reward from gwent players", "copies": 3, "img": "2/2b/Tw3_gwent_card_face_Biting_Frost.png"}, {"id": "g-neutral-bovine-defense-force", "name": "Bovine Defense Force", "faction": "neutral", "type": "unit", "row": "close", "str": 8, "ability": "None", "acquire": "Summoned by the removal of the Cow card during play", "copies": 1, "token": "Summoned when the Cow is removed; not a separate card to collect.", "img": "9/9b/Tw3_gwent_card_face_Bovine_defense_force.png"}, {"id": "g-neutral-cirilla-fiona-elen-riannon", "name": "Cirilla Fiona Elen Riannon", "faction": "neutral", "type": "unit", "hero": true, "row": "close", "str": 15, "ability": "Hero: Not affected by any Special Cards or abilities.; Muster: Find the Roach card in your deck and play it instantly. (Patch 4.0/expired My Rewards)", "acquire": "Won from the Scoia'tael merchant during Gwent: Big City Players", "copies": 1, "img": "f/fb/Tw3_gwent_card_face_Cirilla.png"}, {"id": "g-neutral-clear-weather", "name": "Clear Weather", "faction": "neutral", "type": "weather", "ability": "Removes all Weather Card (Biting Frost, Impenetrable Fog and Torrential Rain) effects.", "acquire": "2 are part of the base deck; 1 is a random reward from gwent players", "copies": 3, "img": "0/07/Tw3_gwent_card_face_Clear_Weather.png"}, {"id": "g-neutral-commander-s-horn", "name": "Commander's Horn", "faction": "neutral", "type": "special", "ability": "Doubles the strength of all unit cards in that row. Limited to 1 per row.", "acquire": "Purchase from the Inn at the Crossroads's innkeep; Purchase from Lindenvale's innkeep; Purchase from Marquise Serenity at the Passiflora; Purchase from Stjepan at The Alchemy; Hearts of Stone expansion: Purchase from merchant at the circus camp near Carsten", "copies": 5, "img": "3/33/Tw3_gwent_card_face_Commanders_Horn.png"}, {"id": "g-neutral-cow", "name": "Cow", "faction": "neutral", "type": "unit", "row": "ranged", "str": 0, "ability": "When this card is removed from the battlefield, it summons a powerful new Unit Card to take its place.", "acquire": "Found inside a barn in Brunwich", "copies": 1, "img": "0/08/Tw3_gwent_card_face_Cow.png"}, {"id": "g-neutral-dandelion", "name": "Dandelion", "faction": "neutral", "type": "unit", "row": "close", "str": 2, "ability": "Commander's Horn: Doubles the strength of all unit cards in that row. Limited to 1 per row.", "acquire": "Won during A Matter of Life and Death", "copies": 1, "img": "5/5d/Tw3_gwent_card_face_Dandelion.png"}, {"id": "g-neutral-decoy", "name": "Decoy", "faction": "neutral", "type": "special", "ability": "Swap with a card on the battlefield to return it to your hand.", "acquire": "Purchase from Elsa or Bram in White Orchard; Purchase from Crow's Perch's Quartermaster; Purchase from the Seven Cats Inn's Innkeep", "copies": 3, "img": "9/92/Tw3_gwent_card_face_Decoy.png"}, {"id": "g-neutral-emiel-regis-rohellec-terzieff", "name": "Emiel Regis Rohellec Terzieff", "faction": "neutral", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Random reward from gwent players", "copies": 1, "img": "0/0a/Tw3_gwent_card_face_Emiel_Regis.png"}, {"id": "g-neutral-gaunter-o-dimm", "name": "Gaunter O'Dimm", "faction": "neutral", "type": "unit", "row": "siege", "str": 2, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "Won from Robert Hilbert during Open Sesame!", "copies": 1, "img": "d/d3/Tw3_gwent_card_face_Gaunt_ODimm.png"}, {"id": "g-neutral-gaunter-o-dimm-darkness", "name": "Gaunter O'Dimm: Darkness", "faction": "neutral", "type": "unit", "row": "ranged", "str": 4, "ability": "Muster: Find any cards with the same name in your deck and play them instantly.", "acquire": "1 purchased from Dulla kh'Amanni at Upper Mill; 2 purchased from the merchant at the circus camp near Carsten", "copies": 3, "img": "c/c9/Tw3_gwent_card_face_Gaunter_ODimm_Darkness.png"}, {"id": "g-neutral-geralt-of-rivia", "name": "Geralt of Rivia", "faction": "neutral", "type": "unit", "hero": true, "row": "close", "str": 15, "ability": "Hero: Not affected by any Special Cards or abilities.; Muster: Find the Roach card in your deck and play it instantly. (Patch 4.0/expired My Rewards)", "acquire": "Thaler during Gwent: Old Pals or Gwent: Playing Thaler", "copies": 1, "img": "a/a6/Tw3_gwent_card_face_Geralt.png"}, {"id": "g-neutral-impenetrable-fog", "name": "Impenetrable Fog", "faction": "neutral", "type": "weather", "ability": "Sets the strength of all Ranged Combat cards to 1 for both players.", "acquire": "2 are part of the base deck; 1 is a random reward from gwent players", "copies": 3, "img": "8/8a/Tw3_gwent_card_face_Impenetrable_Fog.png"}, {"id": "g-neutral-mysterious-elf", "name": "Mysterious Elf", "faction": "neutral", "type": "unit", "hero": true, "row": "close", "str": 0, "ability": "Spy: Place on your opponent's battlefield (counts towards opponent's total) and draw 2 cards from your deck.; Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Gremist during Gwent: Skellige Style", "copies": 1, "img": "5/54/Tw3_gwent_card_face_Mysterious_Elf.png"}, {"id": "g-neutral-olgierd-von-everec", "name": "Olgierd von Everec", "faction": "neutral", "type": "unit", "row": "agile", "str": 6, "ability": "Morale boost: Adds +1 to all units in the row (excluding itself).; Agile: Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed.", "acquire": "Won from Shani", "copies": 1, "img": "b/b4/Tw3_gwent_card_face_Olgierd_von_Everec.png"}, {"id": "g-neutral-roach", "name": "Roach", "faction": "neutral", "type": "unit", "row": "close", "str": 3, "ability": "None", "acquire": "Reward for playing Gwent: The Witcher Card Game", "copies": 1, "token": "Reward from the standalone GWENT game; not obtainable in The Witcher 3 itself.", "img": "4/40/Gwent_cardart_neutral_roach.jpg"}, {"id": "g-neutral-scorch", "name": "Scorch", "faction": "neutral", "type": "special", "ability": "Scorch: Discards after playing. Kills the strongest card(s) on the battlefield.", "acquire": "1 purchased from the Cunny of the Goose's Innkeep; 1 purchased from Jonas at the New Port Inn; 1 purchased from Urialla Harbor's Innkeep", "copies": 3, "img": "b/b8/Tw3_gwent_card_face_Scorch.png"}, {"id": "g-neutral-skellige-storm", "name": "Skellige Storm", "faction": "neutral", "type": "weather", "ability": "Reduces the Strength of all Range and Siege Units to 1.", "acquire": "1 is won from the Tourney Grounds' armorer; 1 is won from the Tourney Grounds' barber; 1 is won from Beauclair Port's butcher", "copies": 3, "img": "1/1a/Tw3_gwent_face_Skellige_Storm.png"}, {"id": "g-neutral-torrential-rain", "name": "Torrential Rain", "faction": "neutral", "type": "weather", "ability": "Sets the strength of all Siege Combat cards to 1 for both players.", "acquire": "2 are part of the base deck; 1 is random rewards from gwent players", "copies": 3, "img": "8/87/Tw3_gwent_card_face_Torrential_Rain.png"}, {"id": "g-neutral-triss-merigold", "name": "Triss Merigold", "faction": "neutral", "type": "unit", "hero": true, "row": "close", "str": 7, "ability": "Hero: Not affected by any Special Cards or abilities.", "acquire": "Lambert during Gwent: Old Pals", "copies": 1, "img": "0/03/Tw3_gwent_card_face_Triss.png"}, {"id": "g-neutral-vesemir", "name": "Vesemir", "faction": "neutral", "type": "unit", "row": "close", "str": 6, "ability": "None", "acquire": "Won from Vimme Vivaldi during Gwent: Big City Players", "copies": 1, "img": "f/f8/Tw3_gwent_card_face_Vesemir.png"}, {"id": "g-neutral-villentretenmerth", "name": "Villentretenmerth", "faction": "neutral", "type": "unit", "row": "close", "str": 7, "ability": "Scorch - Close Combat: Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more.", "acquire": "Random reward from gwent players", "copies": 1, "img": "c/c9/Tw3_gwent_card_face_Villentretenmerth.png"}, {"id": "g-neutral-yennefer-of-vengerberg", "name": "Yennefer of Vengerberg", "faction": "neutral", "type": "unit", "hero": true, "row": "ranged", "str": 7, "ability": "Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).; Hero: Not affected by any Special Cards or abilities.", "acquire": "Won from Stjepan during Gwent: Playing Innkeeps", "copies": 1, "img": "8/8e/Tw3_gwent_card_face_Yennefer.png"}, {"id": "g-neutral-zoltan-chivay", "name": "Zoltan Chivay", "faction": "neutral", "type": "unit", "row": "close", "str": 5, "ability": "None", "acquire": "Won from Aldert Geert in White Orchard or found under the Hanged Man's Tree", "copies": 1, "img": "a/a9/Tw3_gwent_card_face_Zoltan.png"}].map(c => Object.assign({hero:false, row:null, str:null, token:null, v:"wiki", src:["fandomGw","fextraGw"]}, c));
/* Old card ids (before the full list) -> new ids, so saved collections migrate. */
const GWENT_LEGACY = {"g-esterad": "g-nr-esterad-thyssen", "g-natalis": "g-nr-john-natalis", "g-philippa": "g-nr-philippa-eilhart", "g-roche": "g-nr-vernon-roche", "g-letho": "g-nilf-letho-of-gulet", "g-menno": "g-nilf-menno-coehoorn", "g-morvran": "g-nilf-morvran-voorhis", "g-tibor": "g-nilf-tibor-eggebracht", "g-eithne": "g-st-eithne", "g-iorveth": "g-st-iorveth", "g-isengrim": "g-st-isengrim-faoiltiarna", "g-saes": "g-st-saesenthessis", "g-draug": "g-mon-draug", "g-imlerith": "g-mon-imlerith", "g-kayran": "g-mon-kayran", "g-leshen": "g-mon-leshen", "g-cerys": "g-sk-cerys", "g-ermion": "g-sk-ermion", "g-hjalmar": "g-sk-hjalmar", "g-hemdall": "g-sk-hemdall", "g-geralt": "g-neutral-geralt-of-rivia", "g-ciri": "g-neutral-cirilla-fiona-elen-riannon", "g-yen": "g-neutral-yennefer-of-vengerberg", "g-triss": "g-neutral-triss-merigold", "g-elf": "g-neutral-mysterious-elf", "g-villen": "g-neutral-villentretenmerth", "g-dandelion": "g-neutral-dandelion", "g-zoltan": "g-neutral-zoltan-chivay", "g-vesemir": "g-neutral-vesemir", "g-odimm": "g-neutral-gaunter-o-dimm", "g-olgierd": "g-neutral-olgierd-von-everec", "g-cow": "g-neutral-cow", "g-decoy": "g-neutral-decoy", "g-scorch": "g-neutral-scorch", "g-horn": "g-neutral-commander-s-horn", "g-mardroeme": "g-sk-mardroeme", "g-skstorm": "g-sk-skellige-storm", "g-foltest-sf": "g-nr-foltest-the-steel-forged", "g-francesca-q": "g-st-francesca-findabair-queen-of-dol-blathanna", "g-eredin-c": "g-mon-eredin-commander-of-the-red-riders"};
const GWENT_RULES = {minUnits:22, maxSpecials:10};

/* ---------- Achievements ---------- */
const ACH = (id, name, how, group, missable) => ({id, name, how, group, missable: !!missable, v:"wiki", src:["fandomAch"]});
const ACHIEVEMENTS = [
  ACH("ac-friend","A Friend in Need","Find and free Dandelion.","base"),
  ACH("ac-allin","All In","Play 3 hero cards in one round and win the match.","base"),
  ACH("ac-brawler","Brawler","Defeat Olaf, the Skellige fistfight champion.","base"),
  ACH("ac-brawlmaster","Brawl Master","Complete all fistfight quests in Velen, Skellige and Novigrad.","base"),
  ACH("ac-cards","Card Collector","Collect every base-game Gwent card.","base",true),
  ACH("ac-gwentmaster","Gwent Master","Win the Passiflora tournament in High Stakes.","base",true),
  ACH("ac-fullcrew","Full Crew","Bring all possible allies to Kaer Morhen.","base",true),
  ACH("ac-fast","Fast and Furious","Win all horse races.","base"),
  ACH("ac-pro","Geralt: The Professional","Complete all witcher contracts.","base"),
  ACH("ac-king","Kingmaker","Complete the subplot about choosing Skellige's ruler.","base"),
  ACH("ac-doppler","The Doppler Effect","Resolve the doppler problem in Novigrad.","base"),
  ACH("ac-keira","Friends With Benefits","Complete Keira Metz's subplot.","base",true),
  ACH("ac-xeno","Xenonaut","Convince Ge'els to betray Eredin.","base"),
  ACH("ac-assassin","Assassin of Kings","Take part in Radovid's assassination (choice-dependent).","base",true),
  ACH("ac-munchkin","Munchkin","Reach level 35.","base"),
  ACH("ac-mutant","Mutant","Fill all mutagen slots.","base"),
  ACH("ac-dendro","Dendrologist","Buy every ability in one tree.","base"),
  ACH("ac-armed","Armed and Dangerous","Equip a full witcher gear set.","base"),
  ACH("ac-pest","Pest Control","Destroy all monster nests in Velen and Novigrad or in Skellige.","base"),
  ACH("ac-globe","Globetrotter","Discover 100 fast travel points.","base"),
  ACH("ac-power","Power Overwhelming","Have all Place of Power bonuses active at once.","base"),
  ACH("ac-book","Bookworm","Read 30 books.","base"),
  ACH("ac-trial","Passed the Trial","Finish the game on any difficulty.","base"),
  ACH("ac-path","Walked the Path","Finish the game on Death March.","base"),
  ACH("ac-hos-end","Pacta Sunt Servanda","Finish Hearts of Stone.","hos"),
  ACH("ac-shop","Shopaholic","Buy every lot at the Borsodi auction.","hos",true),
  ACH("ac-wedding","Let the Good Times Roll!","Do every activity at the wedding.","hos",true),
  ACH("ac-curator","Curator of Nightmares","Recreate all of Iris's nightmares in the Painted World.","hos",true),
  ACH("ac-ofieri","I Wore Ofieri Before It Was Cool","Collect all Ofieri armor and horse gear plus one Ofieri sword.","hos"),
  ACH("ac-killed","Killed It","Win a Gwent round with total strength of at least 187.","hos"),
  ACH("ac-toad","I'm Not Kissing That","Kill the Toad Prince.","hos"),
  ACH("ac-south","The Witcher's Gone South","Travel to Toussaint.","baw"),
  ACH("ac-virtues","Embodiment of the Five Virtues","Receive Aerondight from the Lady of the Lake.","baw",true),
  ACH("ac-knight","A Knight to Remember","Flawless wins in every tourney competition.","baw",true),
  ACH("ac-golyat","David and Golyat","Kill Golyat with a crossbow bolt to his eye.","baw",true),
  ACH("ac-gwentprob","I Have a Gwent Problem","Collect the whole Skellige deck.","baw"),
  ACH("ac-house","Playing House","Use every Corvo Bianco upgrade.","baw"),
  ACH("ac-weaponw","Weapon \"W\"","Develop a mutation.","baw"),
  ACH("ac-stone","Turned Every Stone","Find every grandmaster diagram for each school.","baw"),
  ACH("ac-grapes","The Grapes of Wrath Stomped","Unite the warring vineyards and get a wine named after you.","baw"),
  ACH("ac-vitis","Last Action Hero","Receive the Order of Vitis Vinifera.","baw")
];

/* ---------- Money ---------- */
const MONEY = {
  early:[
    {title:"Sell to the right merchant type", body:"Armorers pay 20% extra for armor, blacksmiths 20% extra for weapons, herbalists the most for ingredients, innkeepers the most for junk. Patch 1.07 made all merchants accept junk loot.", v:"wiki", src:["fandomMerch", "fandomPatch"]},
    {title:"Haggle contract rewards", body:"Push the haggle slider to just below the point where the client gets annoyed.", v:"rec", src:["rec"]},
    {title:"Clear treasure and guarded loot", body:"Treasure hunts and question-mark locations yield crowns, relic gear and resale goods.", v:"rec", src:["rec"]},
    {title:"Win Gwent stakes", body:"Some players stake crowns. A strong Northern Realms or Monsters deck pays for itself.", v:"rec", src:["rec"]}
  ],
  late:[
    {title:"Spread sales across merchants", body:"Merchants have limited gold that refills over time. Guides commonly report larger gold pools in Toussaint (unverified).", v:"unverified", src:["rec"]},
    {title:"Dismantle versus sell", body:"Dismantle relic gear you do not need into crafting materials, then sell surplus components to craftsmen.", v:"rec", src:["rec"]},
    {title:"Take credit in The Lord of Undvik", body:"Since patch 1.12, prices of goods throughout Skellige drop by 10% after Geralt kills the giant and agrees to take all the credit for it.", v:"wiki", src:["fandomPatch"]},
    {title:"High-level contracts", body:"Late contracts such as The Creature from Oxenfurt Forest (level 35) and Blood and Wine contracts pay more.", v:"rec", src:["rec"]}
  ],
  exploits:[
    {name:"Pang of Conscience sword respawn (Kaer Morhen)", kind:"money", status:"reported", ver:"Remastered 5.0 (one guide, Sep 2026)",
      steps:"At the old signal tower south of the Kaer Morhen fast travel point, loot only the Pang of Conscience from the skeleton and leave the letter. Save, reload, and the sword can respawn. Sell the swords to a blacksmith, who pays 20% extra for weapons.",
      note:"The wiki lists the respawn as a bug. No patch note from 1.01 to 5.01 mentions a fix. Not tested here, and no report covers 5.01 yet.", src:["fandomPang", "gpmMoney", "srPang"]},
    {name:"Chort farming at the White Orchard cow pen", kind:"money", status:"reported", ver:"No version stated",
      steps:"Kill six cows in White Orchard village to summon the level 27 chort (the Bovine Defense Force). Chort hide is worth more than double a cow hide.",
      note:"The wiki says this was partly patched: only one chort appears at a time, and it may not return until you leave White Orchard and come back. The patch is not named.", src:["fandomBDF"]},
    {name:"Cow hide farm in White Orchard", kind:"money", status:"patched", patch:"1.05", note:"Countered by the Bovine Defense Force chort rather than removed. Hearts of Stone's taxman jokes about it.", src:["fandomBDF"]},
    {name:"Infinite drowner respawn farm", kind:"money", status:"patched", patch:"1.05", note:"Wiki pages for 1.04 and 1.05 list the same notes, so the exact patch is ambiguous.", src:["fandomPatch"]},
    {name:"Buy sea shells, sell the pearls", kind:"money", status:"patched", patch:"1.05", note:"Same 1.04/1.05 ambiguity.", src:["fandomPatch"]},
    {name:"Loan shark currency loop (sell foreign currency at Vivaldi Bank)", kind:"money", status:"patched", patch:"1.07", src:["fandomPatch"]},
    {name:"Re-looting gold from the same chest", kind:"money", status:"patched", patch:"1.07", src:["fandomPatch"]},
    {name:"Endless haggling in Contract: Deadly Delights", kind:"money", status:"patched", patch:"1.10", note:"Patch notes call it an issue entailing infinite haggling.", src:["fandomPatch"]},
    {name:"Crookback Bog fiend respawning after every meditation", kind:"xp", status:"patched", patch:"1.10", note:"Listed as an issue, not an exploit, but it allowed repeat kills.", src:["fandomPatch"]},
    {name:"Path of Warriors XP exploit", kind:"xp", status:"patched", patch:"1.10 / 1.22", note:"Listed in both patch notes.", src:["fandomPatch"]},
    {name:"Infinite rune and glyph upgrades", kind:"money", status:"patched", patch:"1.12", src:["fandomPatch"]},
    {name:"Tissue Transmutation alchemy skill exploit", kind:"combat", status:"patched", patch:"1.12", note:"The notes do not describe how it worked.", src:["fandomPatch"]},
    {name:"Superior White Raffard's Decoction with Delayed Recovery", kind:"combat", status:"patched", patch:"1.12", note:"The notes do not describe how it worked.", src:["fandomPatch"]},
    {name:"Pressing O for unlimited Decoy gwent cards", kind:"gwent", status:"patched", patch:"1.22", src:["fandomPatch"]},
    {name:"Aard a beehive at Willis's forge (White Orchard)", kind:"money", status:"patched", patch:"1.22", src:["fandomPatch"]},
    {name:"Second Life mutation infinite health regeneration", kind:"combat", status:"patched", patch:"1.30", note:"A Blood and Wine mutation bug under certain circumstances.", src:["fandomPatch"]},
    {name:"Ofieri merchant money trick", kind:"money", status:"unverified", patch:null, note:"No patch-note evidence found either way.", src:[]},
    {name:"Crow's Perch or Novigrad water/vendor resale trick", kind:"money", status:"unverified", patch:null, note:"No patch-note evidence found either way. Untested on next-gen 4.x.", src:[]}
  ]
};

/* ---------- DLC and NG+ ---------- */
const DLC = {
  hos:{name:"Hearts of Stone", level:"30+", start:"Evil's Soft First Touches (level 32). Take Contract: Monster in the Sewers from the Seven Cats Inn notice board.",
    features:["Runewords and Glyphwords from the Runewright at Upper Mill, after you fund him.","Borsodi auction (one-time) with Viper gear diagrams.","Gaunter O'Dimm and Olgierd Gwent cards."],
    enemies:["The Toad Prince","The Caretaker","Arachnomorph","Ethereal","The Wraith from the Painting","Ofieri mage"], src:["fandom"]},
  baw:{name:"Blood and Wine", level:"34+", start:"Envoys, Wineboys. Notice board at Stonecutters' Settlement in Velen; the wiki says it appears after A Poet Under Pressure.",
    features:["New region: Toussaint.","Mutations (12, one active at a time, up to 4 extra skill slots).","Corvo Bianco vineyard, upgraded through the Majordomo.","Grandmaster witcher gear and Lazare Lafargue.","Skellige Gwent deck.","Armor dyes. Raises the NG+ level cap to 100."],
    enemies:["Bruxa","Alp","Archespore","Barghest","Shaelmaar","Kikimore","Giant centipede","Panther","Spriggan","Wight","Fleder","Garkain","Protofleder","Pale Widow","Golyat","Dracolizard","Cloud Giant","Silver Basilisk","The Beast of Beauclair"], src:["fandom"]}
};
const NGPLUS = {
  requirement:"Finish the main story. Saves made before NG+ was installed must be loaded and re-saved. NG+ arrived as free DLC in August 2015 (patch 1.08.2).",
  keeps:["Gold","Abilities and skills","Most gear, including the stash","Some alchemy formulas","Mutagens (a bug can cut stacks to 1; slotted mutagens are safe)"],
  loses:["Quest items (except minor ones)","Books","Gwent cards, except the base Northern Realms deck","Crafting diagrams, including witcher school diagrams","Many alchemy formulas","Trophies, including Corvo Bianco displays","Map exploration","Bestiary and character entries","Gear displayed at Corvo Bianco outside the stash"],
  scaling:["Geralt is raised to at least level 30.","Quest and monster levels rise by at least 25 and follow your level.","Dropped and crafted gear scales; witcher gear becomes Legendary.","Blood and Wine raises the max level to 100.","Since 4.0, Winter's Blade and the Blade from the Bits scale with level."],
  prep:[
    {id:"ng-rune", text:"Buy Runewright enchantments before NG+ (he is at least 30 levels higher in NG+)."},
    {id:"ng-stash", text:"Move gear you want to keep into the stash, not onto Corvo Bianco displays."},
    {id:"ng-gwent", text:"Accept that Gwent cards reset (except the base Northern Realms deck)."},
    {id:"ng-books", text:"Read books you care about; they do not carry over."},
    {id:"ng-save", text:"Make a dedicated save after the final quest."},
    {id:"ng-pop", text:"Plan to revisit Places of Power: they grant ability points again in NG+."}
  ],
  src:["fandomNG"]
};
</script>
