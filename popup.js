document.getElementById('downloadBtn').addEventListener('click', function() {
    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0].url.includes('abuseipdb.com/whois/')) {
            document.getElementById('status').textContent = 'Please navigate to an AbuseIPDB WHOIS page first!';
            return;
        }
        
        // Inject the collector script
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: collectSubdomains
        });
    });
});

// Function that will be injected into the page
function collectSubdomains() {
    // Find the Subdomains header
    const headers = Array.from(document.getElementsByTagName('h4'));
    const subdomainsHeader = headers.find(h => h.textContent.trim() === 'Subdomains');
    
    if (!subdomainsHeader) {
        alert('No subdomains section found');
        return;
    }

    // Get the parent row div
    const rowDiv = subdomainsHeader.nextElementSibling;
    if (!rowDiv) {
        alert('No subdomain container found');
        return;
    }

    // Get main domain from URL
    const mainDomain = window.location.pathname.split('/').pop();
    
    // Get all li elements in the row and format them with main domain
    const subdomains = Array.from(rowDiv.getElementsByTagName('li'))
        .map(li => {
            const subdomain = li.textContent.trim();
            return subdomain.includes(mainDomain) ? 
                   subdomain : 
                   `${subdomain}.${mainDomain}`;
        })
        .filter(text => text.length > 0);

    // Add main domain to the end
    if (mainDomain) {
        subdomains.push(mainDomain);
    }

    if (subdomains.length === 0) {
        alert('No subdomains found!');
        return;
    }

    // Create the download content
    const content = subdomains.join('\n');
    
    // Create download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomains_${mainDomain}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);

    alert(`Found ${subdomains.length} subdomains. File downloaded!`);
}
