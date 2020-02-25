import './Button.css';

import React from 'react';

const Button = (props) => (
  <button className={props.variant} onClick={props.onClick}>{props.children}</button>
);

export default Button;
