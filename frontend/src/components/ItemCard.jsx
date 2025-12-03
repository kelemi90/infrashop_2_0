import React from 'react';
import { Link } from 'react-router-dom';

export default function ItemCard({ item }){
    return (
        <div style={{border: '1px solid #ddd', padding:12, borderRadius:6}}>
            <div style={{height:140, display:'flex', alignItems:'cemter', justifyContent:'center', background:'#fafafa'}}>
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{maxHeight:120}} /> : <div style={{opacity:0.4}}>No image</div>}
            </div>
            <h4 style={{margin:'8px 0'}}>{item.name}</h4>
            <p style={{fontSize:13, color:'#444'}}>{item.short_description}</p>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <Link to={'/items/${item.id}'}>Details</Link>
                <div style={{fontSize:12}}>Stock: {item.available_stock}</div>
            </div>
        </div>
    );
}