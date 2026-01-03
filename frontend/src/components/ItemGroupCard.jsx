// This page shows ready made item groups 

import React from 'react';

export default function ItemGroupCard({ groupName, items }) {
    return (
        <div style={{width:220, border:'1px solid #ddd', padding:8, borderRadius:6}}>
            {groupName.image_url ? <img src={groupName.image_url} alt={groupName.name} style={{width:'100%', height:120, ogjectFit:'cover'}} /> : <div style={{height:120, backgdoun:'#fafafa'}} />}
            <h4>{group.name}</h4>
            <div style={{fontSize:13, color:'#444'}}>{groupName.description}</div>
            <button style={{marginTop:8}} onClick={onAdd}>Add group to order</button>
        </div>
    );
}