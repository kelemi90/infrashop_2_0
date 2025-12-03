import React from 'react';

export default function HoverPopup({item}) {
    return (
        <div style={{
            position:'absolute', background:'#fff', border:'1px solid #ddd', padding:8, width:220, boxShadow:'0 2px 8px rgba(0,0,0,0.12)'
        }}>
            {item.image_url ? <img src={item.image_url} alt={item.name} style={{width:'100%', height:120, objectFit:'cover'}} /> : null}
            <div style={{fontSize:13, marginTop:6}}>{item.short_description}</div>
        </div>
    );
}