/**
 * Strategy Pattern - Sorting Algorithms
 * 
 * Different sorting strategies for different scenarios.
 */

class DataProcessor {
  constructor(sortStrategy) {
    this.sortStrategy = sortStrategy;
  }

  setSortStrategy(strategy) {
    this.sortStrategy = strategy;
  }

  processData(data) {
    return this.sortStrategy.sort([...data]);
  }
}

class BubbleSortStrategy {
  sort(arr) {
    const data = [...arr];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data.length - i - 1; j++) {
        if (data[j] > data[j + 1]) {
          [data[j], data[j + 1]] = [data[j + 1], data[j]];
        }
      }
    }
    return data;
  }

  getName() { return 'Bubble Sort (O(n²))'; }
}

class QuickSortStrategy {
  sort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[0];
    const left = arr.slice(1).filter(x => x < pivot);
    const right = arr.slice(1).filter(x => x >= pivot);
    return [...this.sort(left), pivot, ...this.sort(right)];
  }

  getName() { return 'Quick Sort (O(n log n))'; }
}

// Usage
const processor = new DataProcessor(new BubbleSortStrategy());
console.log('Using:', processor.sortStrategy.getName());
console.log(processor.processData([5, 2, 8, 1, 9]));

processor.setSortStrategy(new QuickSortStrategy());
console.log('Using:', processor.sortStrategy.getName());
console.log(processor.processData([5, 2, 8, 1, 9]));

module.exports = { DataProcessor, BubbleSortStrategy, QuickSortStrategy };
