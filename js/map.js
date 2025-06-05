// imports
    import { getBizData, getRoomData } from './dataFetch.js';

    // fetch data
    const bizData = await getBizData();
    const roomData = await getRoomData();
    
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const titlePanel = document.getElementById('top-title');
    const infoPanel = document.getElementById('info-panel');
    const overlay = document.getElementById('overlay');


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

    // marker + popup creation
    const markers = [];

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
        starMarker.innerHTML = '<i class="material-icons">&#xe838;</i>';

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

        //popup on hover
        marker.getElement().addEventListener('mouseenter', () => {
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
            popup.remove();
        });

        markers.push(marker);

        // add click listener to uncollapse right sidebar when marker is clicked
        marker.getElement().addEventListener('click', (e) => {
            e.stopPropagation(); // prevent map click events
            if(rightSidebar.classList.contains('collapsed')){ // uncollapse only if collapsed
                toggleSidebar('right-sidebar');
            }
            updateRightPanelBusiness(temp);
        });
    }

    function updateRightPanelBusiness(business){
        const bizName = document.getElementById("businessName");
        const address = document.getElementById("address");
        const phone = document.getElementById("phoneNumber");
        const email = document.getElementById("email");
        const notes = document.getElementById("notes");

        bizName.innerHTML = '';
        address.innerHTML = '';
        phone.innerHTML = '';
        email.innerHTML = '';
        notes.innerHTML = '';

        bizName.innerHTML = `<a href="${business.URL}">${business.label}</a>`;
        address.innerHTML = business.address;
        if(business.phone){
            phone.innerHTML = business.phone;
        }
        if(business.email){
            email.innerHTML = `<a href="mailto:${business.email}">${business.email}</a>`;
        }
        if(business.notes){
            notes.innerHTML = business.notes;
        }
    }
    
    const padding = {};

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
        } else if(id === 'info-panel'){
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

    function updateOverlayVisibility() {
        if (!infoPanel.classList.contains('collapsed')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    //automatically opens the about panel on load
    map.on('load', () => {
        toggleSidebar('top-title');
        toggleSidebar('left-sidebar');
    });

    //listen for left sidebar click
    leftSidebar.addEventListener('click', () => {
        toggleSidebar('left-sidebar');
    })
   
    //listen for right sidebar click
    rightSidebar.addEventListener('click', () => {
        toggleSidebar('right-sidebar');
    })

    //listen for title panel click
    titlePanel.addEventListener('click', () => {
        toggleSidebar('top-title');
    })

    //listen for info button click
    infoPanel.addEventListener('click', () => {
        toggleSidebar('info-panel');
        updateOverlayVisibility();
    })

