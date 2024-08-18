const fetchPostButton = document.getElementById('fetch-post');

async function fetchInstagramPost() {
    try {
        const response = await fetch("https://v1.nocodeapi.com/jayaprakash_317/instagram/nzRRUBKTjoSygRpY", {
            method: "get",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        console.log(result);  // Log the result to inspect its structure
        renderPost(result);
    } catch (error) {
        console.error('Error fetching post:', error);
    }
}

function renderPost(result) {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = '';  // Clear any previous content

    const postData = result.data[0];
    if (postData) {
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const postImage = document.createElement('img');
        postImage.src = postData.media_url;
        postImage.alt = 'Instagram Post';
        postElement.appendChild(postImage);

        const postCaption = document.createElement('p');
        postCaption.textContent = postData.caption || 'No caption available';
        postElement.appendChild(postCaption);

        postContainer.appendChild(postElement);
    } else {
        postContainer.textContent = 'No post data available.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchInstagramPost();
});
