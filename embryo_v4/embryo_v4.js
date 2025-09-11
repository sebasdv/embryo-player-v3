// Sliders: utilidades e inicialización (0..127)
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function createSliderInternals(el){
  const track = document.createElement('div'); track.className = 'slider-track';
  const fill  = document.createElement('div'); fill.className = 'slider-fill';
  const thumb = document.createElement('div'); thumb.className = 'slider-thumb';
  el.appendChild(track); el.appendChild(fill); el.appendChild(thumb);
}
function valueToUI(el, value){
  const v = clamp(value, 0, 127);
  const pct = v / 127;
  const padL = 10, padR = 10;
  const w = el.clientWidth - (padL + padR);
  const thumbRadius = 3; // mitad del ancho (6px)
  const xRaw = padL + pct * w;
  const x = clamp(xRaw, padL + thumbRadius, padL + w - thumbRadius);
  const fill = el.querySelector('.slider-fill');
  const thumb = el.querySelector('.slider-thumb');
  if (fill) fill.style.width = `${clamp(x - padL, 0, w)}px`;
  if (thumb) thumb.style.left = `${x}px`;
  el.dataset.value = String(Math.round(v));
}
function pointerValue(el, clientX){
  const rect = el.getBoundingClientRect();
  const left = rect.left + 10, right = rect.right - 10;
  const w = right - left;
  const clampedX = clamp(clientX, left, right);
  const pct = (clampedX - left) / w;
  return clamp(Math.round(pct * 127), 0, 127);
}
function bindSlider(el){
  let isDragging = false;
  el.addEventListener('mousedown', (e)=>{ isDragging = true; valueToUI(el, pointerValue(el, e.clientX)); e.preventDefault(); });
  document.addEventListener('mousemove', (e)=>{ if(!isDragging) return; valueToUI(el, pointerValue(el, e.clientX)); });
  document.addEventListener('mouseup', ()=>{ isDragging = false; });
  el.addEventListener('touchstart', (e)=>{ isDragging = true; valueToUI(el, pointerValue(el, e.touches[0].clientX)); e.preventDefault(); }, { passive:false });
  document.addEventListener('touchmove', (e)=>{ if(!isDragging) return; valueToUI(el, pointerValue(el, e.touches[0].clientX)); e.preventDefault(); }, { passive:false });
  document.addEventListener('touchend', ()=>{ isDragging = false; });
  createSliderInternals(el);
  valueToUI(el, parseFloat(el.getAttribute('data-value')||'64'));
}
document.querySelectorAll('.slider').forEach(bindSlider);
// (Diales retirados)
// Eventos para botones regulares
document.querySelectorAll('.btn:not(.rec)').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('Botón presionado:', btn.textContent);
  });
});

// Eventos para secciones inferiores de botones rectangulares
document.querySelectorAll('.btn.rec .section-bottom').forEach(section => {
  section.addEventListener('click', () => {
    const topText = section.previousElementSibling.textContent;
    const bottomText = section.textContent;
    console.log('Sección inferior presionada:', `${topText} - ${bottomText}`);
  });
});
