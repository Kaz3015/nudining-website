import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Star extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoverRating: 0
    };
  }

  setHoverRating = (rating) => {
    this.setState({ hoverRating: rating });
  }

  renderStars = () => {
    const { currentRating, onRate } = this.props;
    const { hoverRating } = this.state;

    return Array.from({ length: 5 }, (_, index) => {
      const star = index + 1;
      return (
        <span
          key={star}
          onMouseEnter={() => this.setHoverRating(star)}
          onMouseLeave={() => this.setHoverRating(0)}
          onClick={(event) => onRate(event, star)}
          style={{
            cursor: 'pointer',
            color: star <= (hoverRating || currentRating) ? '#FFD700' : '#ccc'
          }}
        >
          ★
        </span>
      );
    });
  }

  render() {
    return (
      <div className="starRating">
        {this.renderStars()}
      </div>
    );
  }
}

Star.propTypes = {
  currentRating: PropTypes.number.isRequired,
  onRate: PropTypes.func.isRequired
};

export default Star;