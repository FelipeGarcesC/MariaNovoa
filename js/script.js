// 1. CONFIGURACIÓN DE SUPABASE
const supabaseUrl = 'https://ibgmttiuwadrbrakuaas.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ210dGl1d2FkcmJyYWt1YWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzAxMDQsImV4cCI6MjA4OTk0NjEwNH0.KcgYDo46xtu8U2rmxYtNKEvjvARdOq49ZRkIXwQSkfM';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let quiereAgendarTrasLogin = false;


// 2. ELEMENTOS
const authModal = document.getElementById("authModal");
const calendarModal = document.getElementById("calendarModal");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const btnLogout = document.getElementById("btnLogout");
const openModalBtns = document.querySelectorAll(".btn-primary, #openLogin, #openAgendar");
const closeModalBtns = document.querySelectorAll(".close-modal");
const tabBtns = document.querySelectorAll(".tab-btn");
const forms = document.querySelectorAll(".auth-form");
const authMessage = document.getElementById("authMessage");


// 3. FUNCIONES DE APOYO (UI Feedback)
function showAuthMessage(text, isError = true) {
    if (!authMessage) return;
    authMessage.innerText = text;
    authMessage.className = isError ? "auth-message msg-error" : "auth-message msg-success";
    authMessage.style.display = "block";
    setTimeout(() => { authMessage.style.display = "none"; }, 5000);
}


// 4. CARRUSEL SWIPER
const swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,      
    spaceBetween: 40,     
    loop: true,           
    grabCursor: true,     
    pagination: { el: ".swiper-pagination", clickable: true },
    breakpoints: { 1024: { slidesPerView: 3 }, 768: { slidesPerView: 2 } },
    autoplay: { delay: 5000, disableOnInteraction: false },
});


// 5. LÓGICA DE MODALES
authModal.style.display = "none";
calendarModal.style.display = "none";

openModalBtns.forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        const esBotonAgendar = btn.innerText.includes("Agendar") || btn.id === "openAgendar";
        if (currentUser) {
            if(esBotonAgendar) {
                mostrarCalendario();
            }
        } else {
            if(esBotonAgendar){
                quiereAgendarTrasLogin = true;
            }
            authModal.style.display = "flex";
        }
    }
});

closeModalBtns.forEach(btn => {
    btn.onclick = () => {
        authModal.style.display = "none";
        calendarModal.style.display = "none";
    }
});

window.onclick = (event) => {
    if (event.target == authModal) authModal.style.display = "none";
    if (event.target == calendarModal) calendarModal.style.display = "none";
}

tabBtns.forEach(btn => {
    btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        forms.forEach(f => f.classList.remove("active"));
        btn.classList.add("active");
        const targetId = btn.dataset.target + "Form";
        document.getElementById(targetId).classList.add("active");
    }
});


// 6. FUNCIONES DE CALENDARIO Y INTERFAZ
function mostrarCalendario() {
    calendarModal.style.display = "flex";
    const container = document.getElementById("calendly-embed");
    container.innerHTML = "";
    setTimeout(() => {
        Calendly.initInlineWidget({
            url: 'https://calendly.com/psicmarianovoa/sesion',
            parentElement: container,
            prefill: {
                email: currentUser?.email || "",
                name: currentUser?.user_metadata?.full_name || ""
            }
        });
    }, 500); 
}

function actualizarInterfazUsuario() {
    if (currentUser) {
        const userBtn = document.getElementById("openLogin");
        userBtn.innerText = currentUser.user_metadata.full_name;
        btnLogout.style.display = "flex";
        document.getElementById("patientDashboard").style.display = "block";
        document.getElementById("userNameDisplay").innerText = currentUser.user_metadata.full_name || "Paciente";
    }
}


// 7. AUTENTICACIÓN SUPABASE
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;
    const fullName = registerForm.querySelector('input[type="text"]').value;

    const { data, error } = await _supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } }
    });

    if (error) {
        showAuthMessage(error.message, true);
    } else {
        showAuthMessage("¡Registro exitoso! Redirigiendo...", false);
        currentUser = data.user;
        setTimeout(() => {
            authModal.style.display = "none";
            actualizarInterfazUsuario();
            if(quiereAgendarTrasLogin) {
                mostrarCalendario();
                quiereAgendarTrasLogin = false;
            }
        }, 1500);
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showAuthMessage("Credenciales incorrectas", true);
    } else {
        currentUser = data.user;
        showAuthMessage("¡Bienvenido de nuevo!", false);
        setTimeout(() => {
            authModal.style.display = "none";
            actualizarInterfazUsuario(); 
            if(quiereAgendarTrasLogin) {
                mostrarCalendario();
                quiereAgendarTrasLogin = false;
            }
        }, 1500);
    }
});

btnLogout.addEventListener("click", async () => {
    await _supabase.auth.signOut();
    window.location.reload();
});

// 8. PERSISTENCIA
async function checkUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        actualizarInterfazUsuario();
    }
}
checkUser();


// 9. FORMULARIO DE CONTACTO
const contactForm = document.querySelector('.form-contacto');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-contacto');
    
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    try {
        const response = await fetch("https://formspree.io/f/tu_codigo_aqui", { // Reemplaza con tu URL
            method: 'POST',
            body: new FormData(contactForm),
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            btn.innerText = "¡Mensaje enviado! ✓";
            btn.style.backgroundColor = "#5F8D7E";
            contactForm.reset();
        } else {
            throw new Error('Error en el envío');
        }
    } catch (error) {
        btn.innerText = "Error, intenta de nuevo";
        btn.disabled = false;
        btn.style.backgroundColor = "#721c24";
    }
});


