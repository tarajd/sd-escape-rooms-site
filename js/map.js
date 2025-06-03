
    // imports
    import { getBizData, getRoomData } from './dataFetch.js';

    // fetch data
    const bizData = await getBizData();
    const roomData = await getRoomData();
    
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const titlePanel = document.getElementById('top-title');

    // map bounds to keep users from moving away from SD
    var bounds = [
		[-117.74504606513186, 32.38807835711859], // Southwest coordinates
	    [-116.54920134485727, 33.42369231311467] // Northeast coordinates 
	];
    
    // creation of map
    mapboxgl.accessToken = 'pk.eyJ1IjoidGpkaXNzZXIiLCJhIjoiY21hdmdzeTNjMDRiNTJqcTB4bDF4bWg1NCJ9.ESVnuunjJRR0mkNEWBW4Xw';
    const center = [-117.14034840519801, 32.81570168713853]; // center of map
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 9, 
        center: center,
        style: 'mapbox://styles/mapbox/streets-v12',
        maxBounds: bounds,
    });

    // marker + popup creation
    const markers = [];
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'top'
    });

    // iterating through data to make marker & popup specifications
    for(let i = 0; i < bizData.length; i++) {
        const temp = bizData[i]; // business data for this iteration

        let popupContent;
        let popupClass = temp.whitelogo ? "white-logo" : "dark-logo";
        let labelClass = temp.whitelogo ? "popup-label-white" : "popup-label-black";

        const starMarker = document.createElement('div');
        starMarker.innerHTML = '<i class="material-icons">&#xe838;</i>';
        starMarker.style.color = '#eb34cc';
        starMarker.style.fontSize = '24px';
        starMarker.style.textShadow = `
            -1px -1px 0 #8f0377,
            1px -1px 0 #8f0377,
            -1px  1px 0 #8f0377,
            1px  1px 0 #8f0377
        `;

        popupContent = `<h2 class="${labelClass}">${temp.label}</h2>
            <div class="popupImageWrapper">
                <img class="popupImage" src="${temp.logo}" alt="Business logo">
            </div>`;

        const marker = new mapboxgl.Marker(starMarker) 
            .setLngLat([temp.long, temp.lat])
            .addTo(map);

        marker.getElement().addEventListener('mouseenter', () => {
            popup.remove();
            popup.setLngLat([temp.long, temp.lat])
                .setHTML(popupContent)
                .addTo(map);
            popup._container.classList.remove("white-logo", "dark-logo");
            popup._container.classList.add(popupClass);
        });

        marker.getElement().addEventListener('mouseleave', () => {
            popup.remove();
        });

        markers.push(marker);
    }

    function toggleSidebar(id) {
        const elem = document.getElementById(id);

        // add or remove the 'collapsed' CSS class from the sidebar element
        const collapsed = elem.classList.toggle('collapsed');
        const padding = {};

        if(id === 'top-title') { // top title panel
            const topCaret = document.getElementById('top-caret');
            if (topCaret) { // change caret icon when expanding or collapsing
                topCaret.innerHTML = collapsed ? '&#xf0d7;' : '&#xf0d8;'; // Change caret icon based on collapsed state
            }
            padding.top = collapsed ? 0 : 120;
        } else { // right or left
            if(id === 'left-sidebar') { // left sidebar
                const leftBarCaret = document.getElementById('leftbar-caret');
                if(leftBarCaret) { // change caret icon when expanding or collapsing
                    leftBarCaret.innerHTML = collapsed ? '&#xf0da;' : '&#xf0d9;';
                }
                padding.left = collapsed ? 0 : 300;
            }
            else if(id === 'right-sidebar') { // right sidebar
                const rightBarCaret = document.getElementById('rightbar-caret');
                if(rightBarCaret) { // change caret icon when expanding or collapsing
                    rightBarCaret.innerHTML = collapsed ? '&#xf0d9;' : '&#xf0da;';
                }
                padding.right = collapsed ? 0 : 300;
            }
        }

        map.easeTo({ // adjusting map center when sidebar is toggled
            padding: padding,
            duration: 1000
        });
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
