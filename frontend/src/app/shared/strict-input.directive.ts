import { Directive, ElementRef, HostListener, Input } from '@angular/core';

export type StrictInputKind = 'letters' | 'text' | 'decimal' | 'integer' | 'email' | 'username' | 'login';

@Directive({
  selector: 'input[appStrictInput], input[pattern]',
  standalone: true
})
export class StrictInputDirective {
  @Input('appStrictInput') kind: StrictInputKind | undefined;

  constructor(private element: ElementRef<HTMLInputElement>) {}

  private get inputKind(): StrictInputKind {
    if (this.kind) return this.kind;
    const pattern = this.element.nativeElement.getAttribute('pattern') || '';
    if (pattern.includes('._-') && pattern.includes('0-9')) return 'username';
    if (pattern.includes('Ññ') && !pattern.includes('0-9')) return 'letters';
    return 'text';
  }

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    if (!event.data || event.inputType.startsWith('delete')) return;
    const input = this.element.nativeElement;
    const nextValue = `${input.value.slice(0, input.selectionStart ?? input.value.length)}${event.data}${input.value.slice(input.selectionEnd ?? input.value.length)}`;
    if (!this.isValidPartial(nextValue)) event.preventDefault();
  }

  @HostListener('input')
  onInput(): void {
    const input = this.element.nativeElement;
    const sanitized = this.sanitize(input.value);
    if (sanitized !== input.value) {
      input.value = sanitized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private sanitize(value: string): string {
    switch (this.inputKind) {
      case 'letters': return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]/g, '').replace(/ {2,}/g, ' ');
      case 'text': return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,:'()/&-]/g, '');
      case 'decimal': return this.sanitizeDecimal(value);
      case 'integer': return value.replace(/\D/g, '');
      case 'email': return value.replace(/[^A-Za-z0-9._%+@-]/g, '').replace(/@+/g, (match, offset, whole) => offset === whole.indexOf('@') ? '@' : '');
      case 'username': return value.replace(/[^A-Za-z0-9._-]/g, '');
      case 'login': return value.replace(/[^A-Za-z0-9._%+@-]/g, '');
      default: return value;
    }
  }

  private sanitizeDecimal(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const separator = normalized.indexOf('.');
    return separator < 0 ? normalized : `${normalized.slice(0, separator)}.${normalized.slice(separator + 1).replace(/\./g, '')}`;
  }

  private isValidPartial(value: string): boolean {
    switch (this.inputKind) {
      case 'letters': return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]*$/.test(value);
      case 'text': return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,:'()/&-]*$/.test(value);
      case 'decimal': return /^\d*(\.\d*)?$/.test(value);
      case 'integer': return /^\d*$/.test(value);
      case 'email': return /^[A-Za-z0-9._%+@-]*$/.test(value);
      case 'username': return /^[A-Za-z0-9._-]*$/.test(value);
      case 'login': return /^[A-Za-z0-9._%+@-]*$/.test(value);
      default: return true;
    }
  }
}
