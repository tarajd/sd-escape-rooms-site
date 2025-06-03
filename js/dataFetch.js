	
    
    let cachedBizData = null;
    let cachedRoomData = null;

    //grabbing business data from JSON file
    export async function getBizData() { // enables data to be accessed from other .js files

        if (cachedBizData) return cachedBizData; // keep from re-fetching data

        try{
            const res = await fetch('/data/test_businesses.json');

            if(!res.ok){ // error handling
                throw new Error(`{res.status}`);
            }

        cachedBizData = await res.json();

        for(let i = 0; i < cachedBizData.length; i++){
            cachedBizData[i].label = cachedBizData[i].label.toUpperCase();
        }

        return cachedBizData;

        } catch (error){ // error handling
            console.error('Failed to fetch data:', error);
            throw error;
        }
    }
    
    //grabbing room data from JSON file
    export async function getRoomData() { // enables data to be accessed from other .js files

        if (cachedRoomData) return cachedRoomData; // keep from re-fetching data

        try{
            const res = await fetch('/data/test_rooms.json');

            if(!res.ok){ // error handling
                throw new Error(`{res.status}`);
            }

        cachedRoomData = await res.json();
        return cachedRoomData;

        } catch (error){ // error handling
            console.error('Failed to fetch data:', error);
            throw error;
        }
    }