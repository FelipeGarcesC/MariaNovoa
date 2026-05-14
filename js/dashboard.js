const _supabase = supabase.createClient('https://ibgmttiuwadrbrakuaas.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ210dGl1d2FkcmJyYWt1YWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzAxMDQsImV4cCI6MjA4OTk0NjEwNH0.KcgYDo46xtu8U2rmxYtNKEvjvARdOq49ZRkIXwQSkfM');


// 3. SEGURIDAD ACTIVE USER
document.addEventListener("DOMContentLoaded", async () => {
    const { data: { user } } = await _supabase.auth.getUser();

    if (!user) {
        window.location.href = "index.html";
    } else {
        document.getElementById("userNameDisplay").innerText = user.user_metadata.full_name || user.email;
        cargarDatos(user.id);
    }
});


// 3. TRAER DATOS DEL DB
async function cargarDatos(userId) {
    console.log("Cargando datos para el usuario:", userId);
    //TREAR CITA PROXIMA
    const { data: citas } = await _supabase
        .from('sesiones')
        .select('*')
        .eq('user_id', userId)
        .order('fecha_cita', { ascending: true })
        .limit(1);
    
    if (errorCitas) console.error("Error citas:", errorCitas);

    if (citas && citas.length > 0) {
        const fecha = new Date(citas[0].fecha_cita).toLocaleString();
        document.getElementById("nextAppointmentText").innerText = `Tienes una cita el: ${fecha}`;
    } else {
        document.getElementById("nextAppointmentText").innerText = "No tienes citas programadas.";
    }

    //TRAER ACTIVIDADES
    const { data: tareas } = await _supabase
        .from('actividades')
        .select('*')
        .eq('user_id', userId);

    if (errorTareas) console.error("Error tareas:", errorTareas);

    const listaTareas = document.getElementById("activitiesList");
    listaTareas.innerHTML = "";

    if (tareas && tareas.length > 0) {
        tareas.forEach(tarea => {
            const li = document.createElement("li");
            li.innerHTML = `
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} disabled>
                <span>${tarea.titulo}</span>
            `;
            listaTareas.appendChild(li);
        });
        console.log("Tareas cargadas con éxito:", tareas.length);
    } else {
        listaTareas.innerHTML = "<li>No tienes tareas asignadas por ahora.</li>";
    }
}


// 4. LOGICA LOGOUT
document.getElementById("btnLogout").addEventListener("click", async () => {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
});