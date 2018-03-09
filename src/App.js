import React, { Component } from 'react';
import { mock } from './mock'
import { Subject } from 'rxjs'
import { filter } from 'rxjs/operators'

class App extends Component {
  constructor() {
    super()
    this.state = {
      data: {},
      sortKey: '',
      favorites: JSON.parse(window.localStorage.getItem('favorites')) || {},
      filter: '',
      debouncedFilter: '',
    }

    this.onFilter$ = new Subject()
    this.handleFilterChange = this.handleFilterChange.bind(this)
  }

  componentDidMount() {
    this.onFilter$
      .debounceTime(300)
      .subscribe(debouncedFilter => {
        this.setState({ debouncedFilter: debouncedFilter.toLowerCase() })
      })

    mock
      .bufferTime(100)
      .pipe(filter(items => items.length))
      .map(items => {
        let data = {}
        items.forEach(item => {
          data[item.id] = item
        })
        return {...this.state.data, ...data}
      })
      .subscribe(data => {
        this.setState({ data })
      })
  }

  sortDataByFavorite(keys) {
    let fav = []
    let rest = []
    keys.forEach(key => {
      if(this.state.favorites[key]) {
        fav.push(key)
      } else {
        rest.push(key)
      }
    })
    return fav.concat(rest)
  }

  sortDataByKey(keys) {
    let sortKey = this.state.sortKey
    const reverse = sortKey.charAt(0) === '-'

    if(reverse) {
      sortKey = sortKey.substr(1)
    }

    return keys.sort((a, b) => {
      if (this.state.data[a][sortKey] > this.state.data[b][sortKey]) {
        return reverse ? -1 : 1
      }
      return reverse ? 1 : -1
    })
  }

  filterDataByInputText(keys) {
    return keys.filter(key =>
      JSON.stringify(this.state.data[key])
      .toLowerCase()
      .includes(this.state.debouncedFilter)
    )
  }

  prepareData() {
    let keys = Object.keys(this.state.data)

    if(this.state.debouncedFilter) {
      keys = this.filterDataByInputText(keys)
    }

    if(this.state.sortKey) {
      keys = this.sortDataByKey(keys)
    }

    if(Object.keys(this.state.favorites).length) {
      keys = this.sortDataByFavorite(keys)
    }

    return keys.map(key => this.state.data[key])
  }

  renderTableRows() {
    return this.prepareData().map(row => {
      return (
        <tr key={row.id}>
          <td>{row.id}</td>
          <td>{row.assetName}</td>
          <td>{row.price}</td>
          <td>{row.type}</td>
          <td>
            <button
              onClick={this.favoritesAction(row.id)}
              className={this.state.favorites[row.id] ? 'secondary' : ''}>
              { this.state.favorites[row.id] ? 'Remove from' : 'Add to'} favorites
            </button>
          </td>
        </tr>
      )
    })
  }

  handleFilterChange(event) {
    const filter = event.target.value
    this.setState({ filter })
    this.onFilter$.next(filter)
  }

  handleSortKeySelect(value) {
    return () => {
      this.setState({sortKey: this.state.sortKey === value ? `-${value}`: value})
    }
  }

  favoritesAction(name) {
    return () => {
      let favorites = this.state.favorites;

      if(favorites[name]) {
        const {[name]: toDel, ...rest} = favorites
        favorites = rest
      } else {
        favorites[name] = true
      }
      this.setState({ favorites })
      window.localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  }

  getStylesForCell(key) {
    return {
      color: this.state.sortKey === key ? 'red': this.state.sortKey === `-${key}` ? 'green': '#000',
      cursor: 'pointer',
    }
  }

  render() {
    return (
      <div>
      <input placeholder="Filter..." type="text" value={this.state.filter} onChange={this.handleFilterChange}/>
        <table>
          <thead>
            <tr>
              <th style={this.getStylesForCell('id')} onClick={this.handleSortKeySelect('id')}>ID</th>
              <th style={this.getStylesForCell('assetName')} onClick={this.handleSortKeySelect('assetName')}>Name</th>
              <th style={this.getStylesForCell('price')} onClick={this.handleSortKeySelect('price')}>Price</th>
              <th style={this.getStylesForCell('type')} onClick={this.handleSortKeySelect('type')}>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {this.renderTableRows()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
