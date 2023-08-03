import seedrandom from "seedrandom";

function randomAngle(lowerBound, upperBound, index){
    const today = new Date();
    
    const day = today.getDate() + index;
    const month = today.getMonth() + 1 + index;
    const year = today.getFullYear() + index;

    const seed = `${day} ${month} ${year}`;
    const rng = seedrandom(seed);

    const randomIncrement = Math.round((upperBound - lowerBound) * rng());
    return lowerBound + randomIncrement;
}

const Utilities = {
    randomAngle
}

export default Utilities;