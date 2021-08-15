import React, { useEffect } from "react";

function Looper(props){
    const {Component, Number} = props;
    let loopedArry = []

    function theLoop(Component, Number){
        for(let i = 0; i < Number; i++){
            loopedArry.push(Component)
       } 
    }

    theLoop(Component, Number)

    return(
        <div>
            {loopedArry.map((Item)=>{
                return <Item />
            })}
        </div>
    )
}

export default Looper;