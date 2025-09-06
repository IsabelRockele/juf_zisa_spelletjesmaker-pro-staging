document.addEventListener('DOMContentLoaded', () => {
    const sleutelPreview = document.getElementById('sleutel-preview');
    const contentPreview = document.getElementById('content-preview');
    const printContainer = document.getElementById('print-container');

    const downloadPngKnop = document.getElementById('download-png-knop');
    const downloadPdfKnop = document.getElementById('download-pdf-knop');
    const maakNieuweKnop = document.getElementById('maak-nieuwe-knop');

    // Haal data op uit localStorage en toon het
    const sleutelHTML = localStorage.getItem('puzzelSleutelHTML');
    const contentHTML = localStorage.getItem('puzzelContentHTML');

    if (sleutelHTML && contentHTML) {
        sleutelPreview.innerHTML = sleutelHTML;
        contentPreview.innerHTML = contentHTML;
    } else {
        contentPreview.innerHTML = '<h2>Kon de puzzeldata niet laden. Ga terug en probeer het opnieuw.</h2>';
    }
    
    // --- DOWNLOAD LOGICA ---
    
    function download(actie) {
        document.querySelector('.actie-balk').style.display = 'none';

        html2canvas(printContainer, { 
            scale: 2, // Hogere resolutie voor betere kwaliteit
            windowWidth: printContainer.scrollWidth,
            windowHeight: printContainer.scrollHeight
        }).then(canvas => {
            actie(canvas);
            document.querySelector('.actie-balk').style.display = 'flex';
        });
    }
    
    downloadPngKnop.addEventListener('click', () => {
        download(canvas => {
            const link = document.createElement('a');
            link.download = 'geheime_boodschap.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    downloadPdfKnop.addEventListener('click', () => {
        download(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');

            // --- AANGEPASTE CODE VOOR STAAND A4 ---
            // Maak altijd een staand (portrait) A4-document
            const pdf = new jsPDF('p', 'mm', 'a4'); 
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasRatio = canvasWidth / canvasHeight;

            // Bereken de hoogte van de afbeelding als deze de volledige breedte van de PDF inneemt
            let imgHeight = pdfWidth / canvasRatio;
            let imgWidth = pdfWidth;

            // Als de berekende hoogte de pagina overschrijdt, schaal dan op basis van de hoogte
            if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = imgHeight * canvasRatio;
            }

            // Centreer de afbeelding op de pagina
            const xOffset = (pdfWidth - imgWidth) / 2;
            const yOffset = (pdfHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
            pdf.save('geheime_boodschap.pdf');
        });
    });

    // Knop om venster te sluiten
    maakNieuweKnop.addEventListener('click', () => {
        window.close();
    });
});