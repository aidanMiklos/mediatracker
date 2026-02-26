const searchform = document.getElementById("searchform");
const searchfield = document.getElementById("searchfield");
 
async function fetchMovie(event){
	event.preventDefault();
	const data = searchfield.value;
	const response = await fetch("/search", {
		method: "POST",
		headers: {
			"Content-type": "application/json"
		},
		body: JSON.stringify({data: data})
	});

	if (response.ok) {
		const componentHtml = await response.text();
		// Clear and inject the new component into a container
		const container = document.getElementById('mediacontainer');
		container.innerHTML = '';
		container.insertAdjacentHTML('beforeend', componentHtml);

	}
}	
searchform.addEventListener("submit", fetchMovie);
