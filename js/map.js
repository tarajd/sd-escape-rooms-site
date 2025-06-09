// imports
    import { getBizData, getRoomData } from './dataFetch.js';

// fetch data
    const bizData = await getBizData();
    const roomData = await getRoomData();
    
//DOM elements
    const rightSidebar = document.getElementById('right-sidebar');
    const titlePanel = document.getElementById('top-title');
    const infoPanel = document.getElementById('info-panel');
    const overlay = document.getElementById('overlay');
    const unzoomButton = document.getElementById('unzoomButton');
    const rightSidebarContent = document.getElementById('right-sidebar-content');
    const leftSidebarContent = document.getElementById('left-sidebar-content');

    const playerSlider = document.getElementById('playerSliderLabel');
    const difficultySlider = document.getElementById('difficultySliderLabel');
    const kidCheckbox = document.getElementById('kidCheckbox');
    const accessibleCheckbox = document.getElementById('accessibleCheckbox');
    const taraCheckbox = document.getElementById('taraCheckbox');

//set sliders to the left to begin
    playerSlider.value = playerSlider.min;
    difficultySlider.value = difficultySlider.min;

    const markers = [];

    const clearButton = document.getElementById('clear-button');
    clearButton.addEventListener('click', () => {
        clearSelections();
    });
    
    let rightPanelShort = false;
// will be storing previous sidebar state for "back" functionality
    let rightSidebarPrevState = null;

// map bounds to keep users from moving away from SD
    var bounds = [
		[-118.112184882873, 32.043724179831116], // Southwest coordinates
	    [-116.25629122007771, 34.08894951432425] // Northeast coordinates 
	];
    
// creation of map
    mapboxgl.accessToken = 'pk.eyJ1IjoidGpkaXNzZXIiLCJhIjoiY21hdmdzeTNjMDRiNTJqcTB4bDF4bWg1NCJ9.ESVnuunjJRR0mkNEWBW4Xw';
    const center = [-117.14812831426619, 32.89495965661628]; // center of map
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 9.3,
        minZoom: 9.3,
        maxZoom: 16,
        center: center,
        style: 'mapbox://styles/mapbox/streets-v12',
        maxBounds: bounds
    });

// iterating through data to make marker & popup specifications
    for(let i = 0; i < bizData.length; i++) {
        const temp = bizData[i]; // business data for this iteration

        //choosing classes based on certain features
        let popupClass = temp.whitelogo ? "white-logo" : "dark-logo";
        let labelClass = temp.whitelogo ? "popup-label-white" : "popup-label-black";
        let sideClass = temp.side ? "on-left" : "on-right";
        let popupContent = `<h2 class="${labelClass}">${temp.label}</h2>
            <div class="popupImageWrapper">
                <img class="popupImage" src="${temp.logo}" alt="Business logo">
            </div>`;

        let anchorSide = "left";
        // if point is on the left (side attribute exists) then anchor popup on the right
        if(temp.side){
            anchorSide = 'right'; 
        }

        //star marker icon
        const starMarker = document.createElement('div');
        starMarker.innerHTML = '<i class="material-icons noHover">&#xe838;</i>';

        //creating popup
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            anchor: anchorSide
        });

        //creating marker
        const marker = new mapboxgl.Marker(starMarker) 
            .setLngLat([temp.long, temp.lat])
            .addTo(map);
        // Attach business data to marker for filtering
        marker.businessData = temp;

        //popup on hover
        marker.getElement().addEventListener('mouseenter', () => {
            const icon = marker.getElement().querySelector('.material-icons');
            if (icon) {
                icon.classList.remove("noHover");
                icon.classList.add("hover");
            }
            popup.remove();
            popup.setLngLat([temp.long, temp.lat])
                .setHTML(popupContent)
                .addTo(map)
            popup._container.classList.remove("white-logo", "dark-logo");
            popup._container.classList.remove("on-left", "on-right");
            popup._container.classList.add(popupClass);
            popup._container.classList.add(sideClass);
        });

        //end popup when not hover
        marker.getElement().addEventListener('mouseleave', () => {
            const icon = marker.getElement().querySelector('.material-icons');
            if (icon) {
                icon.classList.remove("hover");
                icon.classList.add("noHover");
            }
            popup.remove();
        });

        markers.push(marker);

        // add click listener to uncollapse right sidebar when marker is clicked
        marker.getElement().addEventListener('click', (e) => {

            e.stopPropagation(); // prevent map click events

            if(rightSidebar.classList.contains('collapsed')){ // uncollapse only if collapsed
                toggleSidebar('right-sidebar');
            }
            if(document.getElementById("placeholder")){ //remove placeholder text from right sidebar
                document.getElementById("placeholder").remove();
            }

            updateRightPanelBusiness(temp); //update the info in the right sidebar
            fillRoomsMarker(temp); //fill rooms if a marker is clicked (not left panel filters)

            map.flyTo({ //fly + zoom to the business location on click
                center: ([temp.long, temp.lat]),
                zoom: 14
            });

            //shorten right panel to make room for unzoom button
            rightPanelChangeSize('marker');
            // show unzoom button on zoom
            if(unzoomButton.style.display === ''){
                unzoomButton.style.display = 'flex';
            }

            // set scroll back to top when marker is clicked
            rightSidebarContent.scrollTop = 0;
        });
    }

//event listener for unzoom button (readjust to original coord.s + zoom)
    unzoomButton.addEventListener('click', () => {
        map.flyTo({
            center:([-117.14812831426619, 32.89495965661628]),
            zoom: 9.3
        });
        clearUnzoomButton();
    });

//removing unzoom button once it is clicked (called in the event listener)
    function clearUnzoomButton(){
        if(unzoomButton.style.display === 'flex'){
            unzoomButton.style.display = '';
            rightPanelChangeSize('unzoom');
        }
    }

// toggle space below the right panel for unzoom button
    function rightPanelChangeSize(button) {
        if(rightPanelShort && button === 'unzoom'){
            // make right panel bar longer on click of unzoom button
            document.getElementById('right-sidebar').getElementsByClassName('sidebar-content')[0].classList.remove('zoom');
            // resize right panel toggle button on zoom because the above statement messes up the size
            document.getElementsByClassName('sidebar-toggle')[1].classList.remove('zoom');
            rightPanelShort = !rightPanelShort;
        } else if (!rightPanelShort){
            // make right panel bar shorter on click to fit unzoom button
            document.getElementById('right-sidebar').getElementsByClassName('sidebar-content')[0].classList.add('zoom');
            // resize right panel toggle button on zoom because the above statement messes up the size
            document.getElementsByClassName('sidebar-toggle')[1].classList.add('zoom');
            rightPanelShort = !rightPanelShort;
        }
    }

// showing line between the business information and list of rooms when marker is clicked
    function showBizLine(){
        if(document.querySelector('hr').style.display === ''){
            document.querySelector('hr').style.display = 'block';
        }
    }

// update the business information at the top of the right panel when marker is clicked
function updateRightPanelBusiness(business){
    //clearing any current content in the right sidebar
    clearRightSidebarContent();

    // Set ARIA role and label for screen reader navigation (no aria-live)
    rightSidebarContent.setAttribute('aria-live', 'off');
    rightSidebarContent.setAttribute('role', 'region');
    rightSidebarContent.setAttribute('aria-label', 'Business and room details');

    // Create and append business name (h2)
    const bizName = document.createElement('h2');
    bizName.id = 'businessName';
    bizName.innerHTML = `<a href="${business.URL}">${business.label}</a>`;
    bizName.setAttribute('tabindex', '0');
    bizName.setAttribute('aria-label', `Business: ${business.label}`);
    rightSidebarContent.insertBefore(bizName, rightSidebarContent.firstChild);
    // Move focus to the business name for screen reader
    setTimeout(() => { bizName.focus(); }, 0);

    // Create and append address (h3)
    const address = document.createElement('h3');
    address.id = 'address';
    address.innerHTML = business.address;
    rightSidebarContent.insertBefore(address, rightSidebarContent.children[1]);

    // Create and append phone (h4) if exists
    if(business.phone){
        const phone = document.createElement('h4');
        phone.id = 'phoneNumber';
        phone.textContent = business.phone;
        rightSidebarContent.insertBefore(phone, rightSidebarContent.children[2]);
    }
    // Create and append email (h5) if exists
    if(business.email){
        const email = document.createElement('h5');
        email.id = 'email';
        email.innerHTML = `<a href="mailto:${business.email}">${business.email}</a>`;
        // Insert after phone if phone exists, else after address
        let insertIdx = business.phone ? 3 : 2;
        rightSidebarContent.insertBefore(email, rightSidebarContent.children[insertIdx]);
    }
    // Create and append notes (h6) if exists
    if(business.notes){
        const notes = document.createElement('h6');
        notes.id = 'notes';
        notes.textContent = business.notes;
        // Insert after email/phone/address
        let insertIdx = 4;
        if(!business.phone) insertIdx--;
        if(!business.email) insertIdx--;
        rightSidebarContent.insertBefore(notes, rightSidebarContent.children[insertIdx]);
    }
    const bizLine = document.createElement('hr');
    // Append the business line if it doesn't already exist
    let insertIdx = 5;
    if(!business.phone) insertIdx--;
    if(!business.email) insertIdx--;
    if(!business.notes) insertIdx--;
    if (!document.getElementById('biz-line')) {
        rightSidebarContent.insertBefore(bizLine, rightSidebarContent.children[insertIdx]);
    }
    showBizLine(); // make business line visible
}

//storing previous state for back button functionality depending on whether user used filters or clicked on a marker
    function storePrevState(room, source) {
        // Find the business object for this room if user came from business
        if(source === 'business') {
            rightSidebarPrevState = bizData.find(b => b.id === room.id);
        } else if(source === 'filter') {
            rightSidebarPrevState = rightSidebarContent.innerHTML;
        }
    }

// clear content from right sidebar
    function clearRightSidebarContent(){
        Array.from(rightSidebarContent.children).forEach(child => {
            rightSidebarContent.removeChild(child);
        });
    }

// when room is clicked, show details of that room
function showRoomDetails(room, source) {
    storePrevState(room, source); // store previous state for back button
    clearRightSidebarContent(); // clear out the right sidebar
    const currBiz = bizData.find(b => b.id === room.id) //get the business for the current room
    updateRightPanelBusiness(currBiz); // add business info at top

    let thisRoom = document.createElement('div');
    thisRoom.id = 'room-details';
    thisRoom.setAttribute('tabindex', '-1');
    thisRoom.setAttribute('aria-label', `Room details for ${room.name}`);

    // Add back arrow
    const backArrow = document.createElement('div');
    backArrow.id = 'back-arrow';
    backArrow.style.cursor = 'pointer';
    backArrow.style.fontSize = '1.5em';
    backArrow.style.marginBottom = '10px';
    backArrow.innerHTML = '<i class="fa fa-arrow-left"></i> Back';
    backArrow.setAttribute('tabindex', '0');
    backArrow.setAttribute('role', 'button');
    backArrow.setAttribute('aria-label', 'Back to previous sidebar content');
    backArrow.addEventListener('click', () => {
        restoreRightSidebarPrevState(source, currBiz);
    });
    backArrow.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            restoreRightSidebarPrevState(source, currBiz);
        }
    });
    rightSidebarContent.appendChild(backArrow);

    //adding room name
    let roomName = document.createElement('h1');
    roomName.textContent = room.name;
    roomName.setAttribute('tabindex', '0');
    roomName.setAttribute('aria-label', `Room name: ${room.name}`);
    thisRoom.appendChild(roomName);
    setTimeout(() => { roomName.focus(); }, 0);

    //adding if I've played
    if(room.taraplayed === 'y'){
        let taraPlayed = document.createElement('p');
        taraPlayed.innerHTML = '<i class="material-icons" style="color:#eb34cc; font-size:1em">&#xe838;</i>Tara has played this room!';
        taraPlayed.setAttribute('tabindex', '0');
        taraPlayed.setAttribute('aria-label', 'Tara has played this room');
        thisRoom.appendChild(taraPlayed);
    }

    //adding image
    if(room.image){
        let roomPicture = document.createElement('img');
        roomPicture.src = room.image;
        roomPicture.alt = `Image of room: ${room.name}`;
        roomPicture.setAttribute('tabindex', '0');
        thisRoom.appendChild(roomPicture);
    }

    //adding description
    let description = document.createElement('p');
    description.textContent = room.description;
    thisRoom.appendChild(description);

    //adding group size
    let groupSize = document.createElement('h2');
    groupSize.innerHTML = `<strong>Group Size:</strong> ${room.webpplfloorrec} to ${room.webpplceilingrec}`;
    thisRoom.appendChild(groupSize);

    //adding time
    let time = document.createElement('h2');
    time.innerHTML = `<strong>Time:</strong> ${room.time} minutes`;
    thisRoom.appendChild(time);

    //adding difficulty
    let tempDiff = '';
    if(room.bizdiff){ // add difficulty if it exists
        tempDiff = room.bizdiff.toUpperCase();
        let difficulty = document.createElement('h2');
        difficulty.innerHTML = `<strong>Difficulty: </strong> ${tempDiff}`;
        thisRoom.appendChild(difficulty);
    }

    //adding Morty rating
    let tempRating = "NOT RATED";
    if(room.mortystars){ // add actual rating if one does exist
        tempRating = room.mortystars.toUpperCase();
    }
    let mortyRating = document.createElement('h2');
    mortyRating.innerHTML = `<strong>Rating:</strong> ${tempRating}`;
    thisRoom.appendChild(mortyRating);

    //addinng accessibility information
    let tempAccessibility = "No information provided";
    if(room.accessible){
        if(room.accessible === 'c'){
            tempAccessibility = "Contact business for accomodations.";
        } else if(room.accessible === 'y'){
            tempAccessibility = "This room is accessible.";
        } else if(room.accessible === 'nw'){
            tempAccessibility = "This room is not wheelchair accessible.";
        } else if(room.accessible === 'p'){
            tempAccessibility = "This room contains light physical challenges.";
        } else if(room.accessible === 'rw'){
            tempAccessibility = "Room is wheelchair accessible, but building is not.";
        }
    }
    let accessibility = document.createElement('h2');
    accessibility.innerHTML = `<strong>Accessibility:</strong> ${tempAccessibility}`;
    thisRoom.appendChild(accessibility);

    //adding kid-friendly information
    if(room.kid){
        let kidFriendly = document.createElement('h2');
        if(room.kid === 'y'){
            kidFriendly.innerHTML = '<i class="fa" style="color: #eb34cc; font-size: 1.5em">&#xf1ae;</i>This room is confirmed kid-friendly!';
        } else if(room.kid === 'n'){
            kidFriendly.innerHTML = 'This room is <strong>not</strong> kid-friendly.';
        }
        thisRoom.appendChild(kidFriendly);
    }

    //adding cost information
    let tempCost = "";
    let startingNum = (room.cost2 ? 2 : (room.cost3 ? 3 : 4)) // some rooms start at 3 or 4 players
    for(let i = startingNum; i <= 14; i++){
    let costNum = "cost" + i;
        if(room[costNum]){
            tempCost += `${i} players: $${(room[costNum] * i).toFixed(2)}<br>`;
        } else {
            break;
        }
    }
    let cost = document.createElement('p');
    cost.innerHTML = '<strong>Cost by number of players:</strong><br>' + tempCost;
    thisRoom.appendChild(cost);

    //adding my review if it exists
    if(room.tarareview){
        let taraReview = document.createElement('h3');
        taraReview.innerHTML = `<i class="material-icons" style="color:#eb34cc; font-size:1em">&#xe838;</i><strong style="color:#eb34cc;">Tara's Review:</strong> ${room.tarareview}`;
        thisRoom.appendChild(taraReview);
    }

    //adding booking url
    let bookURL = document.createElement('h2');
    if(room.bookURL === 'c'){
        bookURL.textContent = 'Call business to book.';
    } else {
        bookURL.innerHTML = `<a id="book-link" href="${room.bookURL}"><strong>&#x2192;</strong>Book this room!</a>`
    }
    thisRoom.appendChild(bookURL);

    rightSidebarContent.appendChild(thisRoom);
}

//when right sidebar back arrow is clicked
    function restoreRightSidebarPrevState(source, business) {
        if (rightSidebarPrevState) {
            clearRightSidebarContent(); //clear current content
            if (source === 'business') {
                updateRightPanelBusiness(rightSidebarPrevState);
                fillRoomsMarker(business); //fill rooms if a marker is clicked (not left panel filters)
            } else if (source === 'filter') {
                rightSidebarContent.innerHTML = rightSidebarPrevState;

                // Re-attach event listeners to room entries after restoring HTML
                const h1Array = Array.from(document.querySelectorAll('#right-sidebar-content .room-entry h1'));
                const imgArray = Array.from(document.querySelectorAll('#right-sidebar-content .room-entry img'));

                const roomsListArr = [];
                imgArray.forEach(imgTag => {
                    roomsListArr.push(roomData.find(r => r.image === imgTag.src))
                });
                roomsListArr.forEach((room, idx) => {
                    h1Array[idx].addEventListener('click', () => {
                        showRoomDetails(room, 'filter');
                        rightSidebarContent.scrollTop = 0;
                    });
                    imgArray[idx].addEventListener('click', () => {
                        showRoomDetails(room, 'filter');
                        rightSidebarContent.scrollTop = 0;
                    });
                });
            }
            rightSidebarPrevState = null;
        }
    }

    const padding = {};
// collapse or uncollapse sidebar
    function toggleSidebar(id) {
        const elem = document.getElementById(id);

        // add or remove the 'collapsed' CSS class from the sidebar element
        const collapsed = elem.classList.toggle('collapsed');

        if(id === 'top-title') { // top title panel
            const topCaret = document.getElementById('top-caret');
            if (topCaret) { // change caret icon when expanding or collapsing
                topCaret.innerHTML = collapsed ? '&#xf0d7;' : '&#xf0d8;'; // Change caret icon based on collapsed state
            }
            padding.top = collapsed ? 0 : 120;
        } else if(id === 'info-panel'){ //info panel
            padding.bottom = collapsed ? 0 : 120;
        } else { // right or left
            if(id === 'left-sidebar') { // left sidebar
                const leftBarCaret = document.getElementById('leftbar-caret');
                if(leftBarCaret) { // change caret icon when expanding or collapsing
                    leftBarCaret.innerHTML = collapsed ? '&#xf0da;' : '&#xf0d9;';
                }
                padding.left = collapsed ? 0 : 200;
            }
            else if(id === 'right-sidebar') { // right sidebar
                const rightBarCaret = document.getElementById('rightbar-caret');
                if(rightBarCaret) { // change caret icon when expanding or collapsing
                    rightBarCaret.innerHTML = collapsed ? '&#xf0d9;' : '&#xf0da;';
                }
                padding.right = collapsed ? 0 : 200;
            }
        }

        if(id !== 'info-panel'){
            map.easeTo({ // adjusting map center when sidebar is toggled
            padding: padding,
            duration: 1000
        });
        }
    }

// toggle gray overlay behind info panel on click
    function updateOverlayVisibility() {
        if (!infoPanel.classList.contains('collapsed')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

//automatically opens the top and left panels on load
    map.on('load', () => {
        toggleSidebar('top-title');
        toggleSidebar('left-sidebar');
    });

//left sidebar toggling on click
    document.querySelector('.sidebar-toggle.left').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling just in case
        toggleSidebar('left-sidebar');
    });
   
//right sidebar toggling on click
    document.querySelector('.sidebar-toggle.right').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling just in case
        toggleSidebar('right-sidebar');
    });

//top sidebar toggling on click
    titlePanel.addEventListener('click', () => {
        toggleSidebar('top-title');
    })

//info panel toggling on click
    infoPanel.addEventListener('click', () => {
        toggleSidebar('info-panel');
        updateOverlayVisibility();
    })

    const roomArr = [];
//fill list of rooms if marker is clicked (coming from a businessn "page")
    function fillRoomsMarker(business){
        const roomList = document.createElement('div');
        roomList.id = 'room-list';
        rightSidebarContent.appendChild(roomList);

        // Filter roomData for rooms with the same id as the business
        const matchingRooms = roomData.filter(room => room.id === business.id);
        roomArr.length = 0; // Clear the array in place
        roomArr.push(...matchingRooms); // push to room array

        // actually go and add the rooms in the HTML
        addAllRooms(roomArr, 'business', roomList);
    }

//fill list of rooms if filters are chosen
    function fillRoomsFilter(rooms){
        let roomList = document.createElement('div');
        roomList.id = 'room-list';

        //toggle placeholder text if needed (add if no rooms found that match selections, remove if something is found and the placeholder text is still there)
        if(rooms.length === 0 && !document.getElementById('placeholder')){
            const placeholder = document.createElement('h1');
            placeholder.id = "placeholder";
            placeholder.innerHTML = 'Click on a marker to see business info';
            rightSidebarContent.appendChild(placeholder)
        } else if(document.getElementById('placeholder')){
            document.getElementById('placeholder').remove();
        }

        // actually go and add the rooms in the HTML
        addAllRooms(rooms, 'filter', roomList);
    }

//add all rooms passed in by array to HTML
    function addAllRooms(rooms, source, div){
        //if no rooms meet criteria, then exit the function
        if(rooms.length === 0){
            return;
        }

    // Create an array to hold the room containers
    const roomElements = [];

    for(let r = 0; r < rooms.length; r++){
        // Create a container for each room
        let roomDiv = document.createElement('div');
        roomDiv.className = 'room-entry';

        //adding room name
        let roomName = document.createElement('h1');
        roomName.textContent = rooms[r].name;
        roomName.setAttribute('tabindex', '0');
        roomName.setAttribute('role', 'button');
        roomName.setAttribute('aria-label', `Show details for room: ${rooms[r].name}`);
        roomDiv.appendChild(roomName);
        roomName.addEventListener('click', () => {
            showRoomDetails(rooms[r], source); // pass source as 'filter' for back button functionality
            rightSidebarContent.scrollTop = 0;                
        })
        roomName.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showRoomDetails(rooms[r], source);
                rightSidebarContent.scrollTop = 0;
            }
        });

        //adding business name
        let bizName = document.createElement('h3');
        bizName.textContent = rooms[r].label;
        bizName.setAttribute('tabindex', '0');
        bizName.setAttribute('aria-label', `Business: ${rooms[r].label}`);
        roomDiv.appendChild(bizName);

        //adding if i've played or not
        if(rooms[r].taraplayed === 'y'){
            let taraPlayed = document.createElement('h4');
            taraPlayed.innerHTML = '<i class="material-icons" style="color:#eb34cc; font-size:1em">&#xe838;</i>Tara has played this room!';
            taraPlayed.setAttribute('tabindex', '0');
            taraPlayed.setAttribute('aria-label', 'Tara has played this room');
            roomDiv.appendChild(taraPlayed);
        }

        //adding image
        if(rooms[r].image){
            let roomPicture = document.createElement('img');
            roomPicture.src = rooms[r].image;
            roomPicture.alt = `Image of room: ${rooms[r].name}`;
            roomPicture.setAttribute('tabindex', '0');
            roomPicture.setAttribute('role', 'button');
            roomPicture.setAttribute('aria-label', `Show details for room: ${rooms[r].name}`);
            roomDiv.appendChild(roomPicture);
            roomPicture.addEventListener('click', () => {
                showRoomDetails(rooms[r], source); // pass source as 'filter' for back button functionality
                rightSidebarContent.scrollTop = 0;
            });
            roomPicture.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showRoomDetails(rooms[r], source);
                    rightSidebarContent.scrollTop = 0;
                }
            });
        }

        //adding Morty rating
        let tempRating = "NOT RATED";
        if(rooms[r].mortystars){ // add actual rating if one does exist
            tempRating = rooms[r].mortystars.toUpperCase();
        }
        let mortyRating = document.createElement('h2');
        mortyRating.innerHTML = `Rating: ${tempRating}`;
        roomDiv.appendChild(mortyRating);

        roomElements.push(roomDiv);

    }
    
    // Append all room containers to right sidebar
    roomElements.forEach(el => div.appendChild(el));

    // Append Morty disclaimer at the very end of right sidebar
    let mortyDisclaimer = document.createElement('p');
    mortyDisclaimer.innerHTML = '<br>Listed ratings are sourced from <a id="mortyLink" href="https://morty.app">Morty</a><br>';
    div.appendChild(mortyDisclaimer);

    rightSidebarContent.appendChild(div);
  
}


// handle left sidebar filter changes
    function onFilterChange() {

        //clear everything in right sidebar
        clearRightSidebarContent();
        
        //clearing leftsidebar warning if present
        if(leftSidebarContent.querySelector('h2').style.display === 'block'){
            leftSidebarContent.querySelector('h2').style.display = '';
        }

        // get current values selected by filters
        const p = parseInt(playerSlider.value, 10);
        const d = parseInt(difficultySlider.value, 10);
        const k = kidCheckbox.checked ? 'y' : 'n';
        const a = accessibleCheckbox.checked ? 'y' : 'n';
        const t = taraCheckbox.checked ? 'y' : 'n';

        //toggle right sidebar open if collapsed
        if(rightSidebar.classList.contains('collapsed')){ // uncollapse only if collapsed
            toggleSidebar('right-sidebar');
        }
        //filter the visible markers which returns the array of rooms that match filters and fill in that list of rooms on the right sidebar
        fillRoomsFilter(filterMarkers(p, d, k, a, t));

    }

// Add event listeners for sliders and checkboxes
    playerSlider.addEventListener('input', onFilterChange);
    difficultySlider.addEventListener('input', onFilterChange);
    kidCheckbox.addEventListener('change', onFilterChange);
    accessibleCheckbox.addEventListener('change', onFilterChange);
    taraCheckbox.addEventListener('change', onFilterChange);

// function to filter visible markers by a criteria function
    function filterMarkers(p, d, k, a, t) {
        //reset all markers to visible to start
        resetMarkers();
        let validBizIndices = [];
        let validRooms = [];

        //iterate through all businesses/markers
        for(let i = 0; i < markers.length; i++){
            let mark = markers[i];
            let thisBiz = bizData[i];
            let theseRooms = roomData.filter(room => room.id === thisBiz.id);
            let foundRoom = false;

            //for all businesses, iterate through all their rooms to find ones that match criteria
            for(let ro = 0; ro < theseRooms.length; ro++){
                let thisRoom = theseRooms[ro];
                //checking group size match
                if(thisRoom.webpplceilingrec >= p && thisRoom.webpplfloorrec <= p){
                    if((!thisRoom.bizdiff && (d === 2)) ||
                        (thisRoom.bizdiff === 'variable') || 
                        ((thisRoom.bizdiff ===  'easy') && (d === 1)) ||
                        ((thisRoom.bizdiff ===  'medium') && (d === 2)) ||
                        ((thisRoom.bizdiff ===  'hard') && (d === 3)) ||
                        ((thisRoom.bizdiff ===  'expert') && (d === 4))){
                        //checking kid friendly match
                        if((k === 'n') || (thisRoom.kid === k)){
                            //checking accessible match
                            if((a === 'n') ||
                                ((thisRoom.accessible === 'y') && (a === 'y'))){
                                //checking taraplayed match
                                if((t === 'n') ||
                                    ((t === 'y') && thisRoom.taraplayed === 'y')){
                                    //if all match, we've found a valid room
                                    foundRoom = true;
                                    validRooms.push(thisRoom);
                                }
                            }
                        }
                    }
                }
            } // end of rooms forloop
            if(foundRoom){
                //save this buisness index for later
                validBizIndices.push(i);
                //set this business marker to visible
                mark.getElement().style.visibility = 'visible';
            } else {
                //hide this business marker
                mark.getElement().style.visibility = 'hidden';
            }
        } // end of business forloop
        if(validBizIndices.length === 0){ // add warning message if no rooms meet criteria
            leftSidebarContent.querySelector('h2').style.display = 'block';
        }
        return validRooms;
    }

//clear filter selections and right sidebar
    function clearSelections() {
        //clearing waring if present
        if(leftSidebarContent.querySelector('h2').style.display === 'block'){
            leftSidebarContent.querySelector('h2').style.display = '';
        }

        // Reset all checkboxes
        kidCheckbox.checked = false;
        accessibleCheckbox.checked = false;
        taraCheckbox.checked = false;

        // Reset sliders to their minimum values
        playerSlider.value = playerSlider.min;
        difficultySlider.value = difficultySlider.min;

        //make all markers visible again
        resetMarkers();

        //clear our right sidebar content
        clearRightSidebarContent();

        //put placeholder text back in right sidebar
        if(!document.getElementById("placeholder")){ //if no placeholder, add it
            const placeholder = document.createElement('h1');
            placeholder.id = "placeholder";
            placeholder.innerHTML = 'Click on a marker to see business info';
            rightSidebarContent.appendChild(placeholder);
        }

    }

// function to reset all markers to visible
    function resetMarkers() {
        markers.forEach(marker => {
            marker.getElement().style.visibility = 'visible';
        });
    }

// ACCESSIBILITY FEATURES: Keyboard support for carets, info, unzoom, and clear button
    function handleAccessibleButtonKeydown(e, callback) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callback();
        }
    }

    // Left sidebar caret
    const leftBarCaret = document.getElementById('leftbar-caret');
    if (leftBarCaret) {
        leftBarCaret.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, function() { toggleSidebar('left-sidebar'); }); });
    }
    // Right sidebar caret
    const rightBarCaret = document.getElementById('rightbar-caret');
    if (rightBarCaret) {
        rightBarCaret.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, function() { toggleSidebar('right-sidebar'); }); });
    }
    // Top caret (title panel)
    const topCaret = document.getElementById('top-caret');
    if (topCaret) {
        topCaret.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, function() { toggleSidebar('top-title'); }); });
    }
    // Info panel caret
    const infoButton = document.getElementById('info-button');
    if (infoButton) {
        infoButton.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, function() {
            toggleSidebar('info-panel');
            updateOverlayVisibility();
        }); });
    }
    // Unzoom button
    if (unzoomButton) {
        unzoomButton.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, function() {
            map.flyTo({
                center:([-117.14812831426619, 32.89495965661628]),
                zoom: 9.3
            });
            clearUnzoomButton();
        }); });
    }
    // Clear selections button
    if (clearButton) {
        clearButton.addEventListener('keydown', function(e) { handleAccessibleButtonKeydown(e, clearSelections); });
    }
