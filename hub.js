const canvas=document.getElementById('game')
const ctx=canvas.getContext('2d')
let W=innerWidth,H=innerHeight
canvas.width=W;canvas.height=H

let player={x:W/2,y:H-120,r:18}
let stars=0
let rank=0
let level=1
let combo=1

let meteors=[]
let items=[]
let bosses=[]
let running=false
let skin='default'


const skins=[
{name:'default',color:'#ffffff'},
{name:'neon',color:'#00f7ff'},
{name:'gold',color:'#ffd700'},
{name:'plasma',color:'#ff4df7'},
{name:'cyber',color:'#4dff88'},
{name:'galaxy',color:'#7d7dff'},
{name:'shadow',color:'#111'},
{name:'ruby',color:'#ff0055'},
{name:'emerald',color:'#00ff88'},
{name:'titan',color:'#ffaa00'}
]


const missions=[
{txt:'Collect 30 stars',goal:30,progress:0,reward:200},
{txt:'Survive 60 seconds',goal:60,progress:0,reward:150},
{txt:'Avoid 20 meteors',goal:20,progress:0,reward:120}
]


function initMenus(){
const skinDiv=document.getElementById('skinList')
skins.forEach(s=>{
let b=document.createElement('button')
b.innerText=s.name
b.onclick=()=>equipSkin(s.name)
skinDiv.appendChild(b)
})

const mDiv=document.getElementById('missionList')
missions.forEach(m=>{
let d=document.createElement('div')
d.innerText=m.txt+' reward '+m.reward
mDiv.appendChild(d)
})
}


function startGame(){
document.getElementById('menu').style.display='none'
running=true
spawnLoop()
loop()
}


function spawnLoop(){
setInterval(()=>{
if(!running)return
spawnMeteor()
if(Math.random()<.4)spawnItem()
if(Math.random()<.02)spawnBoss()
},1000)
}


function spawnMeteor(){
meteors.push({x:Math.random()*W,y:-40,r:20,v:3+Math.random()*4})
}


function spawnItem(){
items.push({x:Math.random()*W,y:-40,type:'star',v:3})
}


function spawnBoss(){
bosses.push({x:W/2,y:-120,hp:100})
}


function drawPlayer(){
ctx.save()
ctx.translate(player.x,player.y)
let col=skins.find(s=>s.name==skin).color
ctx.fillStyle=col
ctx.beginPath()
ctx.moveTo(0,-28)
ctx.lineTo(16,20)
ctx.lineTo(-16,20)
ctx.closePath()
ctx.fill()
ctx.restore()
}


function drawBoss(b){
ctx.fillStyle='#aa00ff'
ctx.beginPath()
ctx.arc(b.x,b.y,60,0,Math.PI*2)
ctx.fill()
ctx.fillStyle='#fff'
ctx.fillText('BOSS '+b.hp,b.x-30,b.y-70)
}


function loop(){
if(!running)return
ctx.clearRect(0,0,W,H)

meteors.forEach(m=>{
m.y+=m.v
ctx.fillStyle='#ff6b6b'
ctx.beginPath()
ctx.arc(m.x,m.y,m.r,0,Math.PI*2)
ctx.fill()

if(Math.hypot(player.x-m.x,player.y-m.y)<m.r+player.r){
gameOver()
}
})

items.forEach(i=>{
i.y+=i.v
ctx.fillStyle='#ffe066'
ctx.fillRect(i.x-10,i.y-10,20,20)
})

bosses.forEach(b=>{
b.y+=1
drawBoss(b)
})

drawPlayer()
requestAnimationFrame(loop)
}


function equipSkin(s){skin=s}
function upgrade(){if(stars>=100){stars-=100;level++}}


function openShop(){hideMenus();document.getElementById('shop').style.display='block'}
function openSkins(){hideMenus();document.getElementById('skins').style.display='block'}
function openMissions(){hideMenus();document.getElementById('missions').style.display='block'}
function openLeader(){hideMenus();document.getElementById('leader').style.display='block'}
function closeMenus(){hideMenus();document.getElementById('menu').style.display='block'}
function hideMenus(){
document.getElementById('menu').style.display='none'
document.getElementById('shop').style.display='none'
document.getElementById('skins').style.display='none'
document.getElementById('missions').style.display='none'
document.getElementById('leader').style.display='none'
}


function gameOver(){
running=false
alert('GAME OVER')
location.reload()
}


addEventListener('mousemove',e=>{player.x=e.clientX})

initMenus()

function extra_system_0(v){
let a=v*2
let b=a+8
let c=b%16
return c
}


function extra_system_1(v){
let a=v*7
let b=a+12
let c=b%11
return c
}


function extra_system_2(v){
let a=v*5
let b=a+7
let c=b%11
return c
}


function extra_system_3(v){
let a=v*8
let b=a+15
let c=b%16
return c
}


function extra_system_4(v){
let a=v*7
let b=a+12
let c=b%15
return c
}


function extra_system_5(v){
let a=v*2
let b=a+11
let c=b%9
return c
}


function extra_system_6(v){
let a=v*3
let b=a+10
let c=b%7
return c
}


function extra_system_7(v){
let a=v*6
let b=a+4
let c=b%5
return c
}


function extra_system_8(v){
let a=v*4
let b=a+4
let c=b%7
return c
}


function extra_system_9(v){
let a=v*7
let b=a+14
let c=b%6
return c
}


function extra_system_10(v){
let a=v*2
let b=a+10
let c=b%6
return c
}


function extra_system_11(v){
let a=v*6
let b=a+11
let c=b%15
return c
}


function extra_system_12(v){
let a=v*5
let b=a+10
let c=b%9
return c
}


function extra_system_13(v){
let a=v*7
let b=a+9
let c=b%5
return c
}


function extra_system_14(v){
let a=v*2
let b=a+5
let c=b%10
return c
}


function extra_system_15(v){
let a=v*6
let b=a+14
let c=b%13
return c
}


function extra_system_16(v){
let a=v*6
let b=a+8
let c=b%10
return c
}


function extra_system_17(v){
let a=v*5
let b=a+10
let c=b%6
return c
}


function extra_system_18(v){
let a=v*2
let b=a+13
let c=b%17
return c
}


function extra_system_19(v){
let a=v*3
let b=a+7
let c=b%16
return c
}


function extra_system_20(v){
let a=v*5
let b=a+12
let c=b%15
return c
}


function extra_system_21(v){
let a=v*9
let b=a+7
let c=b%17
return c
}


function extra_system_22(v){
let a=v*2
let b=a+6
let c=b%17
return c
}


function extra_system_23(v){
let a=v*2
let b=a+7
let c=b%14
return c
}


function extra_system_24(v){
let a=v*8
let b=a+15
let c=b%17
return c
}


function extra_system_25(v){
let a=v*7
let b=a+15
let c=b%9
return c
}


function extra_system_26(v){
let a=v*7
let b=a+14
let c=b%16
return c
}


function extra_system_27(v){
let a=v*3
let b=a+5
let c=b%8
return c
}


function extra_system_28(v){
let a=v*6
let b=a+9
let c=b%12
return c
}


function extra_system_29(v){
let a=v*4
let b=a+14
let c=b%6
return c
}


function extra_system_30(v){
let a=v*6
let b=a+10
let c=b%10
return c
}


function extra_system_31(v){
let a=v*8
let b=a+5
let c=b%13
return c
}


function extra_system_32(v){
let a=v*3
let b=a+3
let c=b%13
return c
}


function extra_system_33(v){
let a=v*4
let b=a+4
let c=b%9
return c
}


function extra_system_34(v){
let a=v*6
let b=a+15
let c=b%16
return c
}


function extra_system_35(v){
let a=v*6
let b=a+8
let c=b%11
return c
}


function extra_system_36(v){
let a=v*4
let b=a+7
let c=b%8
return c
}


function extra_system_37(v){
let a=v*5
let b=a+15
let c=b%11
return c
}


function extra_system_38(v){
let a=v*3
let b=a+5
let c=b%7
return c
}


function extra_system_39(v){
let a=v*4
let b=a+10
let c=b%9
return c
}


function extra_system_40(v){
let a=v*8
let b=a+3
let c=b%6
return c
}


function extra_system_41(v){
let a=v*6
let b=a+4
let c=b%8
return c
}


function extra_system_42(v){
let a=v*3
let b=a+15
let c=b%8
return c
}


function extra_system_43(v){
let a=v*7
let b=a+12
let c=b%8
return c
}


function extra_system_44(v){
let a=v*7
let b=a+13
let c=b%11
return c
}


function extra_system_45(v){
let a=v*5
let b=a+12
let c=b%15
return c
}


function extra_system_46(v){
let a=v*2
let b=a+7
let c=b%13
return c
}


function extra_system_47(v){
let a=v*9
let b=a+10
let c=b%17
return c
}


function extra_system_48(v){
let a=v*2
let b=a+6
let c=b%13
return c
}


function extra_system_49(v){
let a=v*5
let b=a+3
let c=b%10
return c
}


function extra_system_50(v){
let a=v*3
let b=a+5
let c=b%17
return c
}


function extra_system_51(v){
let a=v*3
let b=a+11
let c=b%11
return c
}


function extra_system_52(v){
let a=v*6
let b=a+11
let c=b%15
return c
}


function extra_system_53(v){
let a=v*3
let b=a+11
let c=b%8
return c
}


function extra_system_54(v){
let a=v*3
let b=a+11
let c=b%8
return c
}


function extra_system_55(v){
let a=v*6
let b=a+3
let c=b%6
return c
}


function extra_system_56(v){
let a=v*7
let b=a+15
let c=b%16
return c
}


function extra_system_57(v){
let a=v*9
let b=a+11
let c=b%13
return c
}


function extra_system_58(v){
let a=v*9
let b=a+4
let c=b%16
return c
}


function extra_system_59(v){
let a=v*6
let b=a+9
let c=b%14
return c
}


function extra_system_60(v){
let a=v*4
let b=a+7
let c=b%8
return c
}


function extra_system_61(v){
let a=v*8
let b=a+7
let c=b%8
return c
}


function extra_system_62(v){
let a=v*9
let b=a+6
let c=b%7
return c
}


function extra_system_63(v){
let a=v*2
let b=a+13
let c=b%9
return c
}


function extra_system_64(v){
let a=v*5
let b=a+13
let c=b%14
return c
}


function extra_system_65(v){
let a=v*5
let b=a+3
let c=b%10
return c
}


function extra_system_66(v){
let a=v*2
let b=a+4
let c=b%13
return c
}


function extra_system_67(v){
let a=v*8
let b=a+11
let c=b%6
return c
}


function extra_system_68(v){
let a=v*8
let b=a+5
let c=b%14
return c
}


function extra_system_69(v){
let a=v*5
let b=a+13
let c=b%5
return c
}


function extra_system_70(v){
let a=v*7
let b=a+10
let c=b%17
return c
}


function extra_system_71(v){
let a=v*5
let b=a+4
let c=b%6
return c
}


function extra_system_72(v){
let a=v*2
let b=a+12
let c=b%12
return c
}


function extra_system_73(v){
let a=v*9
let b=a+3
let c=b%5
return c
}


function extra_system_74(v){
let a=v*3
let b=a+14
let c=b%16
return c
}


function extra_system_75(v){
let a=v*6
let b=a+10
let c=b%11
return c
}


function extra_system_76(v){
let a=v*6
let b=a+15
let c=b%11
return c
}


function extra_system_77(v){
let a=v*2
let b=a+4
let c=b%6
return c
}


function extra_system_78(v){
let a=v*4
let b=a+15
let c=b%6
return c
}


function extra_system_79(v){
let a=v*8
let b=a+15
let c=b%14
return c
}


function extra_system_80(v){
let a=v*3
let b=a+12
let c=b%7
return c
}


function extra_system_81(v){
let a=v*6
let b=a+12
let c=b%5
return c
}


function extra_system_82(v){
let a=v*3
let b=a+13
let c=b%6
return c
}


function extra_system_83(v){
let a=v*4
let b=a+5
let c=b%10
return c
}


function extra_system_84(v){
let a=v*6
let b=a+4
let c=b%15
return c
}


function extra_system_85(v){
let a=v*4
let b=a+8
let c=b%17
return c
}


function extra_system_86(v){
let a=v*5
let b=a+15
let c=b%11
return c
}


function extra_system_87(v){
let a=v*6
let b=a+10
let c=b%14
return c
}


function extra_system_88(v){
let a=v*2
let b=a+15
let c=b%6
return c
}


function extra_system_89(v){
let a=v*7
let b=a+8
let c=b%8
return c
}


function extra_system_90(v){
let a=v*4
let b=a+15
let c=b%11
return c
}


function extra_system_91(v){
let a=v*4
let b=a+7
let c=b%10
return c
}


function extra_system_92(v){
let a=v*8
let b=a+7
let c=b%12
return c
}


function extra_system_93(v){
let a=v*5
let b=a+3
let c=b%6
return c
}


function extra_system_94(v){
let a=v*2
let b=a+5
let c=b%9
return c
}


function extra_system_95(v){
let a=v*8
let b=a+4
let c=b%7
return c
}


function extra_system_96(v){
let a=v*5
let b=a+15
let c=b%9
return c
}


function extra_system_97(v){
let a=v*7
let b=a+15
let c=b%10
return c
}


function extra_system_98(v){
let a=v*3
let b=a+6
let c=b%16
return c
}


function extra_system_99(v){
let a=v*4
let b=a+13
let c=b%6
return c
}


function extra_system_100(v){
let a=v*4
let b=a+6
let c=b%12
return c
}


function extra_system_101(v){
let a=v*5
let b=a+8
let c=b%8
return c
}


function extra_system_102(v){
let a=v*4
let b=a+15
let c=b%13
return c
}


function extra_system_103(v){
let a=v*5
let b=a+6
let c=b%12
return c
}


function extra_system_104(v){
let a=v*8
let b=a+8
let c=b%6
return c
}


function extra_system_105(v){
let a=v*6
let b=a+9
let c=b%8
return c
}


function extra_system_106(v){
let a=v*9
let b=a+4
let c=b%12
return c
}


function extra_system_107(v){
let a=v*3
let b=a+7
let c=b%16
return c
}


function extra_system_108(v){
let a=v*7
let b=a+3
let c=b%8
return c
}


function extra_system_109(v){
let a=v*5
let b=a+4
let c=b%15
return c
}


function extra_system_110(v){
let a=v*8
let b=a+13
let c=b%17
return c
}


function extra_system_111(v){
let a=v*6
let b=a+5
let c=b%15
return c
}


function extra_system_112(v){
let a=v*2
let b=a+5
let c=b%8
return c
}


function extra_system_113(v){
let a=v*8
let b=a+15
let c=b%12
return c
}


function extra_system_114(v){
let a=v*6
let b=a+13
let c=b%11
return c
}


function extra_system_115(v){
let a=v*4
let b=a+14
let c=b%12
return c
}


function extra_system_116(v){
let a=v*4
let b=a+8
let c=b%15
return c
}


function extra_system_117(v){
let a=v*3
let b=a+5
let c=b%14
return c
}


function extra_system_118(v){
let a=v*7
let b=a+3
let c=b%13
return c
}


function extra_system_119(v){
let a=v*6
let b=a+4
let c=b%17
return c
}


function extra_system_120(v){
let a=v*5
let b=a+15
let c=b%15
return c
}


function extra_system_121(v){
let a=v*7
let b=a+5
let c=b%15
return c
}


function extra_system_122(v){
let a=v*7
let b=a+14
let c=b%16
return c
}


function extra_system_123(v){
let a=v*6
let b=a+13
let c=b%11
return c
}


function extra_system_124(v){
let a=v*3
let b=a+15
let c=b%13
return c
}


function extra_system_125(v){
let a=v*4
let b=a+14
let c=b%13
return c
}


function extra_system_126(v){
let a=v*9
let b=a+11
let c=b%6
return c
}


function extra_system_127(v){
let a=v*7
let b=a+12
let c=b%14
return c
}


function extra_system_128(v){
let a=v*2
let b=a+5
let c=b%6
return c
}


function extra_system_129(v){
let a=v*4
let b=a+6
let c=b%16
return c
}


function extra_system_130(v){
let a=v*4
let b=a+5
let c=b%8
return c
}


function extra_system_131(v){
let a=v*8
let b=a+10
let c=b%6
return c
}


function extra_system_132(v){
let a=v*5
let b=a+5
let c=b%6
return c
}


function extra_system_133(v){
let a=v*4
let b=a+15
let c=b%17
return c
}


function extra_system_134(v){
let a=v*8
let b=a+9
let c=b%5
return c
}


function extra_system_135(v){
let a=v*3
let b=a+15
let c=b%7
return c
}


function extra_system_136(v){
let a=v*5
let b=a+10
let c=b%7
return c
}


function extra_system_137(v){
let a=v*5
let b=a+7
let c=b%7
return c
}


function extra_system_138(v){
let a=v*8
let b=a+7
let c=b%12
return c
}


function extra_system_139(v){
let a=v*9
let b=a+9
let c=b%12
return c
}


function extra_system_140(v){
let a=v*6
let b=a+8
let c=b%7
return c
}


function extra_system_141(v){
let a=v*3
let b=a+12
let c=b%6
return c
}


function extra_system_142(v){
let a=v*5
let b=a+4
let c=b%17
return c
}


function extra_system_143(v){
let a=v*5
let b=a+8
let c=b%8
return c
}


function extra_system_144(v){
let a=v*6
let b=a+5
let c=b%12
return c
}


function extra_system_145(v){
let a=v*2
let b=a+6
let c=b%12
return c
}


function extra_system_146(v){
let a=v*6
let b=a+11
let c=b%8
return c
}


function extra_system_147(v){
let a=v*7
let b=a+5
let c=b%10
return c
}


function extra_system_148(v){
let a=v*5
let b=a+10
let c=b%12
return c
}


function extra_system_149(v){
let a=v*5
let b=a+10
let c=b%12
return c
}


function extra_system_150(v){
let a=v*8
let b=a+5
let c=b%12
return c
}


function extra_system_151(v){
let a=v*3
let b=a+10
let c=b%6
return c
}


function extra_system_152(v){
let a=v*9
let b=a+13
let c=b%6
return c
}


function extra_system_153(v){
let a=v*4
let b=a+7
let c=b%14
return c
}


function extra_system_154(v){
let a=v*7
let b=a+10
let c=b%13
return c
}


function extra_system_155(v){
let a=v*5
let b=a+13
let c=b%5
return c
}


function extra_system_156(v){
let a=v*9
let b=a+10
let c=b%10
return c
}


function extra_system_157(v){
let a=v*6
let b=a+13
let c=b%8
return c
}


function extra_system_158(v){
let a=v*9
let b=a+4
let c=b%10
return c
}


function extra_system_159(v){
let a=v*6
let b=a+12
let c=b%15
return c
}


function extra_system_160(v){
let a=v*9
let b=a+3
let c=b%13
return c
}


function extra_system_161(v){
let a=v*6
let b=a+7
let c=b%6
return c
}


function extra_system_162(v){
let a=v*5
let b=a+8
let c=b%9
return c
}


function extra_system_163(v){
let a=v*5
let b=a+15
let c=b%7
return c
}


function extra_system_164(v){
let a=v*9
let b=a+11
let c=b%8
return c
}


function extra_system_165(v){
let a=v*7
let b=a+10
let c=b%13
return c
}


function extra_system_166(v){
let a=v*2
let b=a+13
let c=b%10
return c
}


function extra_system_167(v){
let a=v*7
let b=a+4
let c=b%11
return c
}


function extra_system_168(v){
let a=v*4
let b=a+15
let c=b%5
return c
}


function extra_system_169(v){
let a=v*3
let b=a+10
let c=b%14
return c
}


function extra_system_170(v){
let a=v*8
let b=a+9
let c=b%13
return c
}


function extra_system_171(v){
let a=v*6
let b=a+13
let c=b%17
return c
}


function extra_system_172(v){
let a=v*4
let b=a+4
let c=b%7
return c
}


function extra_system_173(v){
let a=v*6
let b=a+15
let c=b%6
return c
}


function extra_system_174(v){
let a=v*2
let b=a+4
let c=b%16
return c
}


function extra_system_175(v){
let a=v*5
let b=a+15
let c=b%5
return c
}


function extra_system_176(v){
let a=v*5
let b=a+11
let c=b%11
return c
}


function extra_system_177(v){
let a=v*5
let b=a+9
let c=b%13
return c
}


function extra_system_178(v){
let a=v*9
let b=a+9
let c=b%12
return c
}


function extra_system_179(v){
let a=v*6
let b=a+15
let c=b%7
return c
}


function extra_system_180(v){
let a=v*9
let b=a+9
let c=b%14
return c
}


function extra_system_181(v){
let a=v*8
let b=a+10
let c=b%13
return c
}


function extra_system_182(v){
let a=v*9
let b=a+5
let c=b%8
return c
}


function extra_system_183(v){
let a=v*7
let b=a+3
let c=b%13
return c
}


function extra_system_184(v){
let a=v*8
let b=a+11
let c=b%6
return c
}


function extra_system_185(v){
let a=v*8
let b=a+6
let c=b%11
return c
}


function extra_system_186(v){
let a=v*4
let b=a+3
let c=b%10
return c
}


function extra_system_187(v){
let a=v*9
let b=a+8
let c=b%16
return c
}


function extra_system_188(v){
let a=v*3
let b=a+12
let c=b%17
return c
}


function extra_system_189(v){
let a=v*4
let b=a+8
let c=b%14
return c
}


function extra_system_190(v){
let a=v*4
let b=a+9
let c=b%11
return c
}


function extra_system_191(v){
let a=v*7
let b=a+7
let c=b%9
return c
}


function extra_system_192(v){
let a=v*5
let b=a+8
let c=b%6
return c
}


function extra_system_193(v){
let a=v*3
let b=a+5
let c=b%8
return c
}


function extra_system_194(v){
let a=v*6
let b=a+5
let c=b%7
return c
}


function extra_system_195(v){
let a=v*4
let b=a+15
let c=b%11
return c
}


function extra_system_196(v){
let a=v*7
let b=a+15
let c=b%13
return c
}


function extra_system_197(v){
let a=v*4
let b=a+9
let c=b%12
return c
}


function extra_system_198(v){
let a=v*9
let b=a+15
let c=b%6
return c
}


function extra_system_199(v){
let a=v*9
let b=a+8
let c=b%14
return c
}
