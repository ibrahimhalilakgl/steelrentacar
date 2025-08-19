const qs = (s,el=document)=>el.querySelector(s);
const qsa = (s,el=document)=>[...el.querySelectorAll(s)];

// Mobil menü
const navToggle = qs('.nav-toggle');
const navList = qs('.nav-list');
navToggle?.addEventListener('click',()=>{
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  navList.classList.toggle('show');
});

// Scroll to-top
const toTop = qs('.to-top');
window.addEventListener('scroll',()=>{
  if(window.scrollY>200){
    toTop.classList.add('show');
  }else{
    toTop.classList.remove('show');
  }
});
toTop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// Yıl
const yil = qs('#yil');
if(yil) yil.textContent = new Date().getFullYear();

// Rezervasyon hesaplama (basit tahmin)
const form = qs('#rezervasyon');
const result = qs('#estimateResult');
if(result) result.textContent = '';
const dayMs = 24*60*60*1000;

// Tarih alanları min/varsayılanları
const pickupDateEl = qs('#pickupDate');
const dropoffDateEl = qs('#dropoffDate');

function toDateInputValue(d){
  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

(function initDates(){
  if(!pickupDateEl || !dropoffDateEl) return;
  const today = new Date();
  const tomorrow = new Date(today.getTime()+dayMs);
  pickupDateEl.min = toDateInputValue(today);
  dropoffDateEl.min = toDateInputValue(tomorrow);
  if(!pickupDateEl.value) pickupDateEl.value = toDateInputValue(today);
  if(!dropoffDateEl.value) dropoffDateEl.value = toDateInputValue(tomorrow);
})();

pickupDateEl?.addEventListener('change',()=>{
  if(!pickupDateEl || !dropoffDateEl) return;
  const pick = parseDate(pickupDateEl.value);
  if(!pick) return;
  const minDrop = new Date(pick.getTime()+dayMs);
  const minStr = toDateInputValue(minDrop);
  dropoffDateEl.min = minStr;
  if(dropoffDateEl.value < minStr){
    dropoffDateEl.value = minStr;
  }
  // sadece min değerleri güncelle
});

function parseDate(dateStr){
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function formatCurrencyTRY(value){
  return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value);
}

function estimate(){
  const pickupDate = parseDate(qs('#pickupDate')?.value);
  const dropoffDate = parseDate(qs('#dropoffDate')?.value);
  const carClass = qs('#carClass')?.value || 'ekonomi';
  const driverAge = Number(qs('#driverAge')?.value || 30);

  if(!pickupDate || !dropoffDate){
    result.textContent = '';
    return;
  }

  let days = Math.ceil((dropoffDate - pickupDate)/dayMs);
  if(days<=0){
    result.textContent = 'İade tarihi alış tarihinden sonra olmalıdır.';
    return;
  }

  const baseMap = {ekonomi:950, orta:1350, suv:1950, lux:3250};
  const base = baseMap[carClass] || 950;

  let subtotal = base * days;
  if(driverAge < 25) subtotal *= 1.12; // genç sürücü ek ücreti
  if(days >= 7) subtotal *= 0.9; // haftalık indirim
  if(days >= 14) subtotal *= 0.85; // 2 hafta+

  const kdv = subtotal * 0.2; // örnek KDV
  const total = Math.round(subtotal + kdv);

  result.textContent = `${days} gün için tahmini toplam: ${formatCurrencyTRY(total)}`;
}

// Otomatik tahmin hesaplamaları kaldırıldı (istenmediği için)
form?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const pickupLocEl = qs('#pickupLocation');
  const pickupLoc = pickupLocEl && pickupLocEl.options[ pickupLocEl.selectedIndex ] ? pickupLocEl.options[ pickupLocEl.selectedIndex ].text : '';
  const pd = qs('#pickupDate')?.value || '';
  const pt = qs('#pickupTime')?.value || '';
  const dd = qs('#dropoffDate')?.value || '';
  const dt = qs('#dropoffTime')?.value || '';
  const classEl = qs('#carClass');
  const carClassLabel = classEl && classEl.options[classEl.selectedIndex] ? classEl.options[classEl.selectedIndex].text : '';
  const age = qs('#driverAge')?.value || '';

  const start = parseDate(pd);
  const end = parseDate(dd);
  if(!start || !end || end <= start){
    result.textContent = 'Lütfen geçerli bir tarih aralığı seçiniz.';
    result.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  const msg = `Merhaba, web sitesinden rezervasyon talebi:\n\nAlış: ${pd} ${pt}\nLokasyon: ${pickupLoc}\nİade: ${dd} ${dt}\nAraç sınıfı: ${carClassLabel}\nSürücü yaşı: ${age}\n\nBilgileri onaylayıp fiyat ve uygunluğu paylaşır mısınız?`;
  const wa = `https://wa.me/905417980949?text=${encodeURIComponent(msg)}`;
  window.location.href = wa;
});

// Araç kartı seçiminden sınıfı forma yansıt
qsa('.select-car').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const card = btn.closest('.car-card');
    const cls = card?.getAttribute('data-class');
    const price = Number(card?.getAttribute('data-base')||0);
    const select = qs('#carClass');
    if(select && cls){
      select.value = cls;
      window.scrollTo({top:qs('#rezervasyon').offsetTop-80,behavior:'smooth'});
    }
  });
});

// Mobil menüde linke tıklayınca menüyü kapat
qsa('.nav-list a').forEach(a=>{
  a.addEventListener('click',()=>{
    if(navList?.classList.contains('show')){
      navList.classList.remove('show');
      navToggle?.setAttribute('aria-expanded','false');
    }
  });
});


