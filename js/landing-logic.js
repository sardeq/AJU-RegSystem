import { supabase } from './config.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- Modal Logic ---
    const modal = document.getElementById("registrationModal");
    const bannerBtn = document.getElementById("bannerRegisterBtn");
    const navBtnReg = document.getElementById("navRegisterBtn");
    const footerBtn = document.getElementById("footerRegisterBtn");
    const closeSpan = document.querySelector(".close-button");
    const form = document.getElementById('universityRegistrationForm');

    // Open Modal
    function openModal(e) {
        if(e) e.preventDefault();
        modal.style.display = "block";
    }

    // Close Modal
    function closeModal() {
        modal.style.display = "none";
    }

    if(bannerBtn) bannerBtn.addEventListener('click', openModal);
    if(navBtnReg) navBtnReg.addEventListener('click', openModal);
    if(footerBtn) footerBtn.addEventListener('click', openModal);
    if(closeSpan) closeSpan.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target == modal) closeModal();
    });

    // --- Form Submission Logic ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "جاري الإرسال...";
            submitBtn.disabled = true;

            try {
                // 1. Collect Text Data
                const formData = new FormData(form);
                
                // 2. Handle File Uploads (if any)
                let gradesUrl = null;
                let idUrl = null;

                const gradesFile = document.getElementById('fileGrades').files[0];
                const idFile = document.getElementById('fileId').files[0];
                const timestamp = Date.now();

                // Upload Grades File
                if (gradesFile) {
                    const fileName = `${timestamp}_grades_${gradesFile.name}`;
                    const { data, error } = await supabase.storage
                        .from('admission-docs')
                        .upload(fileName, gradesFile);
                    if (error) throw error;
                    gradesUrl = data.path;
                }

                // Upload ID File
                if (idFile) {
                    const fileName = `${timestamp}_id_${idFile.name}`;
                    const { data, error } = await supabase.storage
                        .from('admission-docs')
                        .upload(fileName, idFile);
                    if (error) throw error;
                    idUrl = data.path;
                }

                // 3. Insert Data into Supabase Table
                const { error: insertError } = await supabase
                    .from('admissions')
                    .insert([{
                        arabic_name: formData.get('arabicName'),
                        english_name: formData.get('englishName'),
                        dob: formData.get('dob'),
                        national_id: formData.get('nationalId'),
                        gender: formData.get('gender'),
                        nationality: formData.get('nationality'),
                        phone: formData.get('phone'),
                        email: formData.get('email'),
                        address: formData.get('address'),
                        high_school_year: formData.get('hsYear'),
                        gpa: formData.get('gpa'),
                        branch: formData.get('branch'),
                        college: formData.get('college'),
                        major: formData.get('major'),
                        grades_file_url: gradesUrl,
                        id_file_url: idUrl
                    }]);

                if (insertError) throw insertError;

                // Success
                alert('تم إرسال طلب الالتحاق بنجاح! سنتواصل معك قريباً.');
                form.reset();
                closeModal();

            } catch (err) {
                console.error('Submission Error:', err);
                alert('حدث خطأ أثناء الإرسال: ' + err.message);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});