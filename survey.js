const SUPABASE_URL = "https://dmsovrbkoeivkvmlzals.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc292cmJrb2Vpdmt2bWx6YWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTg3NTMsImV4cCI6MjA5MjkzNDc1M30.Tf_8-AEkON4hvKsWiljiDV5z_LJW7KUebIkU-0R8x_A";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const questions = [
  "Personelimizin sizi karşılama biçimi ve nezaketi",
  "İhtiyaçlarınızın doğru anlaşılması ve bilgilendirme düzeyi",
  "Yapılan aksesuar montajının kalitesi ve işçiliği",
  "Aracınızın size söz verilen zamanda teslim edilmesi",
  "Aracınızın teslimat anındaki temizlik durumu",
  "Fiyat / Performans karşılama oranı",
  "İşletmemizi tavsiye etme olasılığınız",
  "Herhangi bir durumda muhatap bulabiliyor musunuz?"
];
const emojis = ["😡","☹️","😐","🙂","🤩"];
const questionsEl=document.getElementById("questions"), form=document.getElementById("surveyForm"), message=document.getElementById("message"), submitBtn=document.getElementById("submitBtn"), contactAllowed=document.getElementById("contactAllowed"), phoneBox=document.getElementById("phoneBox");
function renderQuestions(){questionsEl.innerHTML=questions.map((q,index)=>{const no=index+1;const ratings=[1,2,3,4,5].map(value=>`<input required type="radio" name="q${no}" id="q${no}_${value}" value="${value}"><label for="q${no}_${value}"><span>${emojis[value-1]}</span><small>${value}</small></label>`).join("");return `<div class="question"><div class="question-title">${no}. ${q}</div><div class="rating">${ratings}</div></div>`;}).join("");}
contactAllowed.addEventListener("change",()=>phoneBox.classList.toggle("hidden",!contactAllowed.checked));
form.addEventListener("submit",async(e)=>{e.preventDefault();message.textContent="";submitBtn.disabled=true;submitBtn.textContent="Gönderiliyor...";try{const fd=new FormData(form);const payload={q1:Number(fd.get("q1")),q2:Number(fd.get("q2")),q3:Number(fd.get("q3")),q4:Number(fd.get("q4")),q5:Number(fd.get("q5")),q6:Number(fd.get("q6")),q7:Number(fd.get("q7")),q8:Number(fd.get("q8")),suggestion:document.getElementById("suggestion").value.trim()||null,contact_allowed:contactAllowed.checked,phone:contactAllowed.checked?(document.getElementById("phone").value.trim()||null):null,user_agent:navigator.userAgent};const { error }=await sb.from("customer_surveys").insert(payload);if(error) throw error;form.reset();phoneBox.classList.add("hidden");message.textContent="Teşekkür ederiz. Değerlendirmeniz başarıyla gönderildi.";message.style.color="#0a7d28";}catch(err){console.error(err);message.textContent="Gönderim sırasında hata oluştu. Lütfen tekrar deneyin.";message.style.color="#b00020";}finally{submitBtn.disabled=false;submitBtn.textContent="Anketi Gönder";}});
renderQuestions();
